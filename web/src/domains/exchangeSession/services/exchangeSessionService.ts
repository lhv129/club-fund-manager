"use client";
import {BaseRepository} from "@/lib/baseRepository"; import {browserAdapter} from "@/lib/http/browserAdapter"; import type {ExchangeSession,ExchangeSessionPlayer} from "../types"; import type {ApiResponse} from "@/types/api";
class Service<T> extends BaseRepository<T>{protected resource:string;protected adapter=browserAdapter;constructor(resource:string){super();this.resource=resource;}toggleStatus(id:number){return this.adapter.put<ApiResponse<T>>(`${this.resource}/${id}/toggle-status`);}complete(id:number){return this.adapter.put<ApiResponse<T>>(`${this.resource}/${id}/complete`);}togglePaid(id:number){return this.adapter.put<ApiResponse<T>>(`${this.resource}/${id}/toggle-paid`);}}
export const getExchangeSessionService=(slug:string)=>new Service<ExchangeSession>(`/clubs/${slug}/exchange-sessions`);
export const getExchangePlayerService=(slug:string,id:number)=>new Service<ExchangeSessionPlayer>(`/clubs/${slug}/exchange-sessions/${id}/players`);
