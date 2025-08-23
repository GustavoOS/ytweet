import { getRepositories, type Repositories } from "@worker/uow/repositories";
import type { Db, Tx } from "@worker/uow/types";

export interface UOW<X> {
    repositories: Repositories;
    transact: <T>(fn: (tx: X) => Promise<T>) => Promise<T>
    useTransaction: (tx: X) => void;
}

export class UnitOfWork implements UOW<Tx> {
    private db: Db;
    public repositories: Repositories;

    constructor(db: Db) {
        this.db = db;
        this.repositories = getRepositories(db);
    }

    public useTransaction(tx: Tx) {
        console.info("Using transaction repositories")
        this.repositories = getRepositories(tx);
    }

    public transact<T>(fn: (tx: Tx) => Promise<T>) {
        console.log("Starting transaction")
        return this.db.transaction(fn);
    }
}
