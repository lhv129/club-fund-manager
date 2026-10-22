<?php

/**
 * CLUB DOMAIN LANGUAGE FILE
 * ------------------------------------------
 * Chỉ dùng cho module Club Member Roles:
 * login, register, logout, reset password
 *
 * Cách dùng:
 * __('domains/club_member_role.{key}')
 */

return [
    'sync_role_success' => 'Role synchronized successfully.',
    'role_not_found' => 'Club member role record not found.',
    'role_not_in_club' => 'The member role does not belong to the specified club.',
    'invalid_role_scope' => 'The role scope is invalid.',
    'global_role_required' => 'Only system-level roles can be assigned.',
    'role_not_assigned_to_globally' => 'The user has not been assigned a system-level role.',
    'delete_role_success' => 'User role removed successfully.',

    'attributes' => [
        'club_member_role_id' => 'Club member role ID',
        'role_slug' => 'Role slug',
        'club_slug' => 'Club slug',
        'user_id' => 'User ID',
    ],
];
