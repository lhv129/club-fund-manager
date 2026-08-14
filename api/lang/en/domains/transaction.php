<?php

return [
    'attributes' => [
        'club_id' => 'Club',
        'bank_account_id' => 'Bank Account',
        'type' => 'Transaction Type',
        'amount' => 'Amount',
        'balance' => 'Balance',
        'description' => 'Description',
        'reference_code' => 'Reference Code',
        'sender_name' => 'Sender Name',
        'sender_account' => 'Sender Account',
        'transaction_date' => 'Transaction Date',
        'source' => 'Source',
        'is_active' => 'Active Status',
        'sort_order' => 'Sort Order',
    ],

    'list' => 'Transactions retrieved successfully.',
    'detail' => 'Transaction retrieved successfully.',
    'select' => 'Transaction list retrieved successfully.',
    'created' => 'Transaction created successfully.',
    'updated' => 'Transaction updated successfully.',
    'deleted' => 'Transaction deleted successfully.',
    'status_toggled' => 'Transaction status updated successfully.',
    'reordered' => 'Transaction order updated successfully.',

    'not_found' => 'Transaction not found.',
    'financial_fields_immutable' => 'Bank transactions only allow description updates.',
    'webhook_delete_forbidden' => 'Webhook bank transactions cannot be deleted.',
    'in_use' => 'This transaction is already used for reconciliation and cannot be deleted.',
];
