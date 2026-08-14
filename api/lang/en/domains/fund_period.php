<?php

return [
    'attributes' => [
        'club_id'                 => 'Club',
        'year'                    => 'Year',
        'month'                   => 'Month',
        'male_amount'             => 'Male amount',
        'female_amount'           => 'Female amount',
        'exchange_male_amount'    => 'Male exchange amount',
        'exchange_female_amount'  => 'Female exchange amount',
        'is_locked'               => 'Lock status',
        'is_active'               => 'Active status',
        'sort_order'              => 'Sort order',
        'title'                   => 'Title',
        'description'             => 'Description',
    ],

    // ============================================================
    // SUCCESS
    // ============================================================

    'list' => 'Fund periods retrieved successfully.',

    'trashed' => 'Fund periods trashed retrieved successfully,',

    'detail' => 'Fund period details retrieved successfully.',

    'select' => 'Fund periods for dropdown retrieved successfully.',

    'created' => 'Fund period created successfully.',

    'updated' => 'Fund period updated successfully.',

    'deleted' => 'Fund period deleted successfully.',

    'restored' => 'Fund period restored successfully.',

    'closed' => 'Fund period closed successfully.',

    'reopened' => 'Fund period reopened successfully.',

    'reordered' => 'Fund period order updated successfully.',

    'status_activated' => 'Fund period activated.',

    'status_deactivated' => 'Fund period deactivated.',


    // ============================================================
    // COMMON ERRORS
    // ============================================================

    'not_found' => 'Fund period not found.',

    'already_exists' => 'A fund period for this month and year already exists.',

    'deleted_period_exists' => 'A fund period for this month and year already exists but has been deleted. Please restore it instead of creating a new one.',


    // ============================================================
    // DELETE / RESTORE
    // ============================================================

    'cannot_delete_locked' => 'A locked fund period cannot be deleted.',

    'not_deleted' => 'This fund period has not been deleted.',

    'restore_conflict' => 'The fund period cannot be restored because another fund period already exists for the same month and year.',


    // ============================================================
    // LOCK / CLOSE
    // ============================================================

    'already_locked' => 'The fund period is already locked.',

    'locked' => 'This fund period is locked and cannot be modified.',

    'cannot_close' => 'The fund period cannot be closed.',


    // ============================================================
    // REOPEN
    // ============================================================

    'not_locked' => 'The fund period is not locked.',

    'reopen_reason_required' => 'Please provide a reason for reopening the fund period.',


    // ============================================================
    // CONTRIBUTION / BUSINESS RULE
    // ============================================================

    'has_unresolved_contributions' => 'The fund period still has unresolved contributions.',

    'has_outstanding_contributions' => 'The fund period still has outstanding payments.',

    'cannot_modify_locked' => 'Data in a locked fund period cannot be modified.',
];
