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
            'title' => 'Fund payment reminder for :month/:year',
            'body' => 'You need to pay :amount to :club_name.',
        ],
        'monthly_contribution_created' => [
            'title' => 'Fund payment notice for :month/:year',
            'body' => ':club_name has created a contribution of :amount for you.',
        ],
        'monthly_contribution_updated' => [
            'title' => 'Fund payment updated for :month/:year',
            'body' => 'Your contribution of :amount at :club_name has been updated to status :status.',
        ],
        'monthly_contribution_cancelled' => [
            'title' => 'Fund payment cancelled for :month/:year',
            'body' => 'Your contribution of :amount at :club_name has been cancelled.',
        ],
        'monthly_contribution_deleted' => [
            'title' => 'Fund payment deleted for :month/:year',
            'body' => 'Your contribution of :amount at :club_name has been deleted.',
        ],
    ],
];
