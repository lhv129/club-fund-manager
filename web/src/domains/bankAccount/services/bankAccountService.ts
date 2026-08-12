"use client";

import { BaseRepository } from "@/lib/baseRepository";
import { browserAdapter } from "@/lib/http/browserAdapter";

import type { BankAccount } from "../types";
import type { ApiResponse } from "@/types/api";

class BankAccountService extends BaseRepository<BankAccount> {
    protected resource = "bank-accounts";
    protected adapter = browserAdapter;
    toggleStatus(id: number, data?: Record<string, unknown>): Promise<ApiResponse<BankAccount>> { return this.post<ApiResponse<BankAccount>>(`/${this.resource}/${id}/toggle-status`, data); }

    /**
     * POST /clubs/{clubSlug}/bank-accounts/{id}/toggle-default
     */
    toggleDefault(id: number, data?: Record<string, unknown>) {
        return this.post(`/${this.resource}/${id}/toggle-default`, data);
    }
}

export const bankAccountService = new BankAccountService();
export const getBankAccountService = (_clubSlug?: string) => bankAccountService;
