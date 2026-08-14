<?php

/**
 * EXCEPTION LANGUAGE FILE
 * ------------------------------------------
 * API error messages
 */

return [
    // app/Base/BaseRequest.php
    'validation_failed' => 'The given data was invalid.',
    'unauthorized'      => 'Unauthenticated.',
    'forbidden'         => 'You do not have permission.',
    'not_found'         => 'Resource not found.',
    'server_error'      => 'Internal server error, please try again later.',
    'forbidden_action' => 'You do not have permission to perform this action.',

    // app/Middleware/JwtAuthenticate.php
    'token_not_provided'       => 'Access token is required in Authorization header.',
    'token_expired'            => 'Access token has expired.',
    'token_blacklisted'        => 'Access token has been blacklisted.',
    'token_invalid'            => 'Invalid access token.',
    'token_invalid_signature'  => 'Invalid token signature.',

    // app/Middleware/CheckClubPermission
    'no_club_permission' => 'You do not have permission to access or perform this action on the club.',
    'club_not_found' => 'Club not found.',
    'club_context_required' => 'Either club_id or club_slug is required.',
    'club_context_mismatch' => 'The provided club_id and club_slug do not identify the same club.',
    'club_id_invalid' => 'The club_id field must be a positive integer.',
];
