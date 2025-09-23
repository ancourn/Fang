// Operational Transformation (OT) for collaborative editing
export interface TextOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
}

export interface TextChange {
  operations: TextOperation[];
  baseVersion: number;
  clientId: string;
  timestamp: number;
}

export class OperationalTransformation {
  // Transform two operations to resolve conflicts
  static transform(op1: TextOperation, op2: TextOperation): [TextOperation, TextOperation] {
    // If operations don't overlap, return them as-is
    if (this.operationsDontOverlap(op1, op2)) {
      return [op1, op2];
    }

    // Handle different operation type combinations
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      return this.transformDeleteInsert(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }

    return [op1, op2];
  }

  // Check if two operations don't overlap
  private static operationsDontOverlap(op1: TextOperation, op2: TextOperation): boolean {
    const op1End = op1.position + (op1.content?.length || op1.length || 0);
    const op2End = op2.position + (op2.content?.length || op2.length || 0);
    
    return op1End <= op2.position || op2End <= op1.position;
  }

  // Transform two insert operations
  private static transformInsertInsert(op1: TextOperation, op2: TextOperation): [TextOperation, TextOperation] {
    if (op1.position <= op2.position) {
      // op1 comes first, op2 needs to be shifted
      const shiftedOp2 = {
        ...op2,
        position: op2.position + (op1.content?.length || 0)
      };
      return [op1, shiftedOp2];
    } else {
      // op2 comes first, op1 needs to be shifted
      const shiftedOp1 = {
        ...op1,
        position: op1.position + (op2.content?.length || 0)
      };
      return [shiftedOp1, op2];
    }
  }

  // Transform insert and delete operations
  private static transformInsertDelete(op1: TextOperation, op2: TextOperation): [TextOperation, TextOperation] {
    const deleteEnd = op2.position + (op2.length || 0);
    
    if (op1.position <= op2.position) {
      // Insert comes before delete, no transformation needed
      return [op1, op2];
    } else if (op1.position >= deleteEnd) {
      // Insert comes after delete, shift insert position
      const shiftedOp1 = {
        ...op1,
        position: op1.position - (op2.length || 0)
      };
      return [shiftedOp1, op2];
    } else {
      // Insert is inside delete range, keep insert position but adjust delete
      const shiftedOp2 = {
        ...op2,
        length: (op2.length || 0) + (op1.content?.length || 0)
      };
      return [op1, shiftedOp2];
    }
  }

  // Transform delete and insert operations
  private static transformDeleteInsert(op1: TextOperation, op2: TextOperation): [TextOperation, TextOperation] {
    const deleteEnd = op1.position + (op1.length || 0);
    
    if (op2.position <= op1.position) {
      // Insert comes before delete, shift delete position
      const shiftedOp1 = {
        ...op1,
        position: op1.position + (op2.content?.length || 0)
      };
      return [shiftedOp1, op2];
    } else if (op2.position >= deleteEnd) {
      // Insert comes after delete, no transformation needed
      return [op1, op2];
    } else {
      // Insert is inside delete range, adjust delete length
      const shiftedOp1 = {
        ...op1,
        length: (op1.length || 0) + (op2.content?.length || 0)
      };
      return [shiftedOp1, op2];
    }
  }

  // Transform two delete operations
  private static transformDeleteDelete(op1: TextOperation, op2: TextOperation): [TextOperation, TextOperation] {
    const op1End = op1.position + (op1.length || 0);
    const op2End = op2.position + (op2.length || 0);
    
    if (op1End <= op2.position) {
      // op1 comes before op2, shift op2
      const shiftedOp2 = {
        ...op2,
        position: op2.position - (op1.length || 0)
      };
      return [op1, shiftedOp2];
    } else if (op2End <= op1.position) {
      // op2 comes before op1, shift op1
      const shiftedOp1 = {
        ...op1,
        position: op1.position - (op2.length || 0)
      };
      return [shiftedOp1, op2];
    } else {
      // Overlapping deletes - normalize to non-overlapping
      if (op1.position <= op2.position) {
        if (op1End >= op2End) {
          // op1 completely contains op2
          const shiftedOp2 = {
            ...op2,
            length: 0
          };
          return [op1, shiftedOp2];
        } else {
          // Partial overlap, adjust op2
          const shiftedOp2 = {
            ...op2,
            position: op1End,
            length: op2End - op1End
          };
          return [op1, shiftedOp2];
        }
      } else {
        if (op2End >= op1End) {
          // op2 completely contains op1
          const shiftedOp1 = {
            ...op1,
            length: 0
          };
          return [shiftedOp1, op2];
        } else {
          // Partial overlap, adjust op1
          const shiftedOp1 = {
            ...op1,
            position: op2End,
            length: op1End - op2End
          };
          return [shiftedOp1, op2];
        }
      }
    }
  }

  // Apply an operation to text
  static apply(text: string, operation: TextOperation): string {
    switch (operation.type) {
      case 'insert':
        return (
          text.slice(0, operation.position) +
          (operation.content || '') +
          text.slice(operation.position)
        );
      
      case 'delete':
        return (
          text.slice(0, operation.position) +
          text.slice(operation.position + (operation.length || 0))
        );
      
      case 'retain':
        return text; // No change
      
      default:
        return text;
    }
  }

  // Apply multiple operations to text
  static applyAll(text: string, operations: TextOperation[]): string {
    return operations.reduce((currentText, operation) => {
      return this.apply(currentText, operation);
    }, text);
  }

  // Create operations from text diff
  static createDiff(oldText: string, newText: string): TextOperation[] {
    const operations: TextOperation[] = [];
    let i = 0;
    let j = 0;

    while (i < oldText.length || j < newText.length) {
      if (i < oldText.length && j < newText.length && oldText[i] === newText[j]) {
        // Characters match, move forward
        i++;
        j++;
      } else {
        // Find the difference
        let deleteLength = 0;
        let insertContent = '';

        // Count consecutive deletions
        while (i < oldText.length && (j >= newText.length || oldText[i] !== newText[j])) {
          deleteLength++;
          i++;
        }

        // Count consecutive insertions
        while (j < newText.length && (i >= oldText.length || oldText[i] !== newText[j])) {
          insertContent += newText[j];
          j++;
        }

        // Create operations
        if (deleteLength > 0) {
          operations.push({
            type: 'delete',
            position: i - deleteLength,
            length: deleteLength
          });
        }

        if (insertContent.length > 0) {
          operations.push({
            type: 'insert',
            position: i - deleteLength,
            content: insertContent
          });
        }
      }
    }

    return operations;
  }

  // Transform a change against another change
  static transformChange(change1: TextChange, change2: TextChange): TextChange {
    const transformedOps: TextOperation[] = [];
    
    for (const op1 of change1.operations) {
      let transformedOp = op1;
      
      for (const op2 of change2.operations) {
        const [transformed] = this.transform(transformedOp, op2);
        transformedOp = transformed;
      }
      
      transformedOps.push(transformedOp);
    }
    
    return {
      operations: transformedOps,
      baseVersion: change1.baseVersion,
      clientId: change1.clientId,
      timestamp: change1.timestamp
    };
  }

  // Compose two operations
  static compose(op1: TextOperation, op2: TextOperation): TextOperation[] {
    const operations: TextOperation[] = [op1];
    
    // Apply op2 to the result of op1 and create new operations
    const tempText = this.apply('', op1);
    const finalText = this.apply(tempText, op2);
    
    // If the result is just applying both operations in sequence
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position + op1.content!.length === op2.position) {
        // Adjacent inserts can be merged
        return [{
          type: 'insert',
          position: op1.position,
          content: op1.content + op2.content
        }];
      }
    }
    
    return operations.concat([op2]);
  }
}

// Client-side OT manager for collaborative editing
export class OTClient {
  private clientId: string;
  private currentVersion: number;
  private pendingChanges: TextChange[];
  private serverVersion: number;
  private buffer: string;

  constructor(clientId: string) {
    this.clientId = clientId;
    this.currentVersion = 0;
    this.serverVersion = 0;
    this.pendingChanges = [];
    this.buffer = '';
  }

  // Handle local text change
  localChange(oldText: string, newText: string): TextChange | null {
    const operations = OperationalTransformation.createDiff(oldText, newText);
    
    if (operations.length === 0) {
      return null;
    }

    const change: TextChange = {
      operations,
      baseVersion: this.currentVersion,
      clientId: this.clientId,
      timestamp: Date.now()
    };

    this.pendingChanges.push(change);
    this.currentVersion++;
    this.buffer = newText;

    return change;
  }

  // Handle remote change from server
  remoteChange(change: TextChange): TextOperation[] {
    // Transform the remote change against all pending local changes
    let transformedChange = change;
    
    for (const pendingChange of this.pendingChanges) {
      transformedChange = OperationalTransformation.transformChange(
        transformedChange,
        pendingChange
      );
    }

    // Apply the transformed change to the buffer
    this.buffer = OperationalTransformation.applyAll(this.buffer, transformedChange.operations);
    this.serverVersion++;

    return transformedChange.operations;
  }

  // Acknowledge a change has been applied by server
  acknowledgeChange(changeId: string): void {
    this.pendingChanges = this.pendingChanges.filter(
      change => change.clientId !== changeId
    );
  }

  // Get current buffer state
  getBuffer(): string {
    return this.buffer;
  }

  // Get current version
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  // Get server version
  getServerVersion(): number {
    return this.serverVersion;
  }
}