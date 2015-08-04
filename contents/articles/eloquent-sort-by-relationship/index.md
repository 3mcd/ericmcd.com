---
title: Sort By Relationship With Eloquent ORM
author: eric
date: 2014-11-20 7:30
template: article.jade
---
Sort and order an API resource by relationship in Laravel's object relational mapper.
<span class="more"></span>

I decided to build an API in [Laravel](http://laravel.com/ "Laravel Website") as the backend for my team's time tracking application. Laravel has all of the necessary tools to build full-scale applications, and I used it for it's superb router, controllers, query builder and object relational mapper (dubbed [Eloquent](http://laravel.com/docs/4.2/eloquent "Eloquent Docs")).

I was having trouble sorting collections pulled from my endpoints. Basic sorting with Laravel's query builder is [dead simple](http://laravel.com/docs/4.2/queries#selects "Laravel Query Builder"), but I wanted to sort by properties on related models. In this particular case, I wanted to sort a set of sub-projects by the name of their parent project. Simple, right?

It appears Eloquent doesn't have this functionality out of the box, but fortunately Laravel has a useful feature called [Query Scopes](http://laravel.com/docs/4.2/eloquent#query-scopes "Laravel Query Scopes") that allow for custom, chainable Eloquent methods.

Query scopes are easy to define. Simply prefix the name of a static method on a model with "scope":

```php
class ResourceModel extends Eloquent {

    public static function scopeParseSort($query, $sort, $order)
    {
        /* ... */
    }
}
```

You can now access this method as a static member on the `ResourceModel` class, like `ResourceModel::parseSort()`.

I wanted to perform the sorting without using multiple query parameters in the request. The method I devised splits a single `sort` query parameter by a delimiter and makes a few assumptions:
- the first segment (`$split[0]`) is the other table's name
- the second segment (`$split[1]`) is the column to sort by
- the foreign key name is the singular form of the other table's name + "_id"

Below is an example implementation:

```php
public static function scopeParseSort($query, $sort, $order)
{
    if (!isset($sort)) {
        return $query;
    }

    $split = explode('.', $sort);

    if (count($split) > 1) {
        $sortTable = $split[0];
        $sortColumn = $split[1];
        $fkPrefix = rtrim($sortTable, 's');

        // ResourceModel method that returns name of table as a string,
        // see https://github.com/laravel/framework/issues/1436
        $table = self::getTableName();
        $keyName = $table . '.' . $fkPrefix . '_id';

        $query = $query
            ->join($sortTable, $keyName, '=', $sortTable . '.id')
            ->orderBy($sortColumn, $order)
            ->addSelect($table . '.*');
    } else {
        $query = $query->orderBy($sort, $order);
    }

    return $query;
}
```

`parseSort` is then executable as a static member on classes that inherit from `ResourceModel`:

```php
class ProjectController extends ResourceController {

    public function index()
    {
        $sort = Input::get('sort', 'id');
        $order = Input::get('order', 'asc');

        // Execute parseSort with the sort and order `GET` parameters
        $query = SubProject::parseSort($sort, $order);

        // ResourceController method, retrieve and format the collection of models
        $resource = $this->getResource($query);

        return $this->respond($resource);
    }
```

With this implementation, the response from the URI "/api/sub_projects?sort=projects.name" would include a collection of sub-projects sorted by the names of their parent projects.

Keep in mind that there are some major limitations with the current state of `queryParseSort`. You can only search by properties that are one relationship deep, and foreign keys/tables must follow strict naming conventions.
