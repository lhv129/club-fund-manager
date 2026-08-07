// src/domains/transaction/services/transactionService.ts
"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";

import type { Transaction } from "../types";

class TransactionServiceClient extends BaseRepository<Transaction> {
    protected resource: string;
    protected adapter = browserAdapter;

    constructor(clubSlug: string) {
        super();

        this.resource = `/clubs/${clubSlug}/transactions`;
    }
}

const serviceCache = new Map<string, TransactionServiceClient>();

export function getTransactionService(
    clubSlug: string
): TransactionServiceClient {
    if (!serviceCache.has(clubSlug)) {
        serviceCache.set(
            clubSlug,
            new TransactionServiceClient(clubSlug)
        );
    }

    return serviceCache.get(clubSlug)!;
}