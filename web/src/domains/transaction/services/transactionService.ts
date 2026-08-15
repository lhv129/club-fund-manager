// src/domains/transaction/services/transactionService.ts
"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";

import type { Transaction } from "../types";

class TransactionServiceClient extends BaseRepository<Transaction> {
    protected resource = "transactions";
    protected adapter = browserAdapter;

    override show(
        id: number | string,
        clubSlug?: string,
    ): Promise<import("@/types/api").ApiResponse<Transaction>> {
        return this.get(`/${this.resource}/${id}`, {
            club_slug: clubSlug,
        });
    }

}
export const transactionService = new TransactionServiceClient();
export const getTransactionService = (_clubSlug?: string) => transactionService;
