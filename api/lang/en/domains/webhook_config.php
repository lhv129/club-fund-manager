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
        'is_active'      => 'Active Status',
        'sort_order'     => 'Sort Order',
        'bank_account_id' => 'Bank Account',
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
