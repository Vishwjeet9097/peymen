
import { Dexie } from 'dexie';
import type { Table } from 'dexie';
import { Transaction } from '../types';

// Using the named import of Dexie to ensure that inherited methods like 'version' and 'stores' 
// are correctly recognized by the TypeScript compiler on the extended class.
export class PeymenDatabase extends Dexie {
  transactions!: Table<Transaction>;

  constructor() {
    super('PeymenDatabase');
    // Defining the database schema version.
    // The .version() method defines the database structure for specific versions.
    // Fix: Using named import for Dexie to ensure proper type inheritance for the 'version' method.
    this.version(1).stores({
      transactions: 'id, date, amount, type, merchant, source'
    });
  }

  async clearAll() {
    await this.transactions.clear();
  }
}

export const db = new PeymenDatabase();
