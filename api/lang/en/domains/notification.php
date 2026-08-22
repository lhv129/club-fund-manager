<?php

return [
    'list' => 'Notification list.',
    'unread_count' => 'Unread notification count.',
    'marked_read' => 'Notification marked as read.',
    'marked_all_read' => 'All notifications marked as read.',
    'deleted' => 'Notification deleted.',
    'not_found' => 'Notification not found.',

    'types' => [

        'fund_due' => [
            'title' => 'Fund payment reminder',
            'body' => 'You need to pay the fund contribution for :month/:year to :club_name.',
        ],

        'monthly_contribution_created' => [
            'title' => 'New fund contribution',
            'body' => ':club_name created a fund contribution for :month/:year for you.',
        ],

        'monthly_contribution_updated' => [
            'title' => 'Fund contribution updated',
            'body' => 'Your fund contribution for :month/:year at :club_name has been updated to status :status.',
        ],

        'monthly_contribution_cancelled' => [
            'title' => 'Fund contribution cancelled',
            'body' => 'Your fund contribution for :month/:year at :club_name has been cancelled.',
        ],

        'monthly_contribution_deleted' => [
            'title' => 'Fund contribution deleted',
            'body' => 'Your fund contribution for :month/:year at :club_name has been deleted.',
        ],

        'transaction_confirmed' => [
            'title' => 'Fund payment confirmed',
            'body' => 'Your fund contribution for :month/:year at :club_name has been confirmed via bank transfer.',
        ],

        'cash_payment_confirmed' => [
            'title' => 'Cash payment confirmed',
            'body' => 'Your fund contribution for :month/:year at :club_name has been recorded as a cash payment.',
        ],

        'club_transaction_received' => [
            'title' => 'New contribution received',
            'body' => ':member_name paid the fund contribution for :month/:year to :club_name.',
        ],

        'club_expense_created' => [
            'title' => 'New expense',
            'body' => ':club_name recorded a new expense.',
        ],
    ],
];
