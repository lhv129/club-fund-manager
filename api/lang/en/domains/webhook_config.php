<?php

/**
 * WEBHOOK CONFIG DOMAIN LANGUAGE FILE
 */

return [
    'attributes' => [
        'type' => 'Provider Type',
        'webhook_secret' => 'Webhook Secret',
        'webhook_url'    => 'Webhook URL',
        'is_verified'    => 'Verification Status',
        'bank_account_id' => 'Bank Account',
    ],

    'list'           => 'Webhook configs retrieved successfully.',
    'detail'         => 'Webhook config detail retrieved successfully.',
    'select'         => 'Webhook configs (select) retrieved successfully.',
    'created'        => 'Webhook config created successfully.',
    'updated'        => 'Webhook config updated successfully.',
    'deleted'        => 'Webhook config deleted successfully.',
    'not_found'      => 'Webhook config not found.',
    'duplicate_bank_account_type' => 'This bank account already has a webhook configuration in the current club.',
];
