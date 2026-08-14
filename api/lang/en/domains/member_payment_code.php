<?php

return [
    'attributes' => [
        'monthly_contribution_id' => 'Monthly Contribution',
        'payment_code'            => 'Payment Code',
        'status'                  => 'Status',
        'expired_at'              => 'Expired At',
        'used_at'                 => 'Used At',
        'is_active'               => 'Active Status',
        'sort_order'             => 'Sort Order',
    ],

    'list'                  => 'Payment codes retrieved successfully.',
    'detail'                => 'Payment code retrieved successfully.',
    'generated'             => 'Payment code generated successfully.',
    'no_active_code'        => 'No active payment code for this contribution.',
    'not_found'             => 'Payment code not found.',
    'contribution_not_found' => 'Monthly contribution not found.',
    'forbidden' => 'You do not have permission to retrieve the payment code.',
    'already_paid' => 'You have already paid for this month.',
    "qr_bank_not_configured" => "The bank is not configured for QR code generation.",
    'already_cancelled' => 'This monthly contribution has already been cancelled.',
];
