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
    'server_error'      => 'Internal server error.',
    'forbidden_action' => 'You do not have permission to perform this action.',

    // app/Middleware/JwtAuthenticate.php
    'token_not_provided'       => 'Access token is required in Authorization header.',
    'token_expired'            => 'Access token has expired.',
    'token_blacklisted'        => 'Access token has been blacklisted.',
    'token_invalid'            => 'Invalid access token.',
    'token_invalid_signature'  => 'Invalid token signature.',

    // app/bootstrap/app.php
    'server_error' => 'Internal server error, please try again later.',

    // app/Base/BaseService.php
    'not_found' => 'Resource not found.',
];
