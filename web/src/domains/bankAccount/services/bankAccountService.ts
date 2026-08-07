"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";

import type { BankAccount } from "../types";

class BankAccountService extends BaseRepository<BankAccount> {
    protected resource: string;
    protected adapter = browserAdapter;

    constructor(clubSlug: string) {
        super();
        this.resource = `/clubs/${clubSlug}/bank-accounts`;
    }

    /**
     * POST /clubs/{clubSlug}/bank-accounts/{id}/toggle-default
     */
    toggleDefault(id: number) {
        return this.post(`${this.resource}/${id}/toggle-default`);
    }
}

export function getBankAccountService(clubSlug: string) {
    return new BankAccountService(clubSlug);
}