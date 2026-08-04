<?php

/**
 * WEBHOOK CONFIG DOMAIN LANGUAGE FILE
 */

return [
    'attributes' => [
        'type'            => 'provider type',
        'api_key'         => 'API key',
        'webhook_secret' => 'webhook secret',
        'webhook_url'    => 'webhook URL',
        'is_verified'    => 'verification status',
        'is_active'      => 'active status',
        'sort_order'     => 'sort order',
        'bank_account_id' => 'bank account',
    ],

    'list'           => 'Webhook configs retrieved successfully.',
    'detail'         => 'Webhook config detail retrieved successfully.',
    'select'         => 'Webhook configs (select) retrieved successfully.',
    'created'        => 'Webhook config created successfully.',
    'updated'        => 'Webhook config updated successfully.',
    'deleted'        => 'Webhook config deleted successfully.',
    'status_toggled' => 'Webhook config status updated successfully.',
    'reordered'      => 'Webhook config order updated successfully.',
    'not_found'      => 'Webhook config not found.',
];
