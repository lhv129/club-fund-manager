<?php

if (!function_exists('next_sort_order')) {
    function next_sort_order($model, $column = 'sort_order')
    {
        return $model::max($column) + 1;
    }
}
