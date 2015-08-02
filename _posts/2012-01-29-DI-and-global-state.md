---
layout: posts
title: DI and global state
description: A look at how dependency injection can help combat the global state produced by Singletons.
author: Charles Sprayberry
published: true
category: programming
redirect_from:
  - /2012/01/29/DI-and-global-state.html

disqus_enabled: true
disqus_shortname: ramblingsofaphpenthusiast
disqus_identifier: /2012/01/29/DI-and-global-state
disqus_url: http://cspray.github.com/2012/01/29/DI-and-global-state.html
---
In a previous post I talked about <a href="{% post_url 2012-01-24-why-you-should-use-DI %}">
why you should use Dependency Injection</a>. It garnered a little bit of attention, getting
[some votes on reddit/r/PHP](http://www.reddit.com/r/PHP/comments/owcaw/why_you_should_use_dependency_injection/)
and also showing up [on phpdeveloper.org](http://phpdeveloper.org/news/17457).
With the attention came some criticism, justly served, particularly in regards to a lack of code examples.
To help better explain each of the three aspects of DI I discussed in the previous article I'll be going
over each more thoroughly and with those code examples requested. I'll be going through each point
one at a time as the explanations will likely be of some length compared to the original post.

I decided to start off first with something that I feel strongly about. Global state and
[Singletons](http://sourcemaking.com/design_patterns/singleton). At one point my code was
riddled with global state and Singletons.  Then I started unit testing. Let me tell ya, global state
*sucks*. And yea, Singleton === global state.

In the traditional Singleton pattern you retrieve the instance through a <code>Class::getInstance()</code>
static method. This is just a fancy way of encapsulating global state. Whatever is returned from this
method is available to *all the things*. If you think about your application can you really
think of something that makes sense for **everything** to have the ability to touch?
I know I have a hard time rationalizing something like that at this point.

### meet the villains

First, let's take a look at our nasty ol' Singleton.

{% highlight php %}
<?php

class NastyOlSingleton {

    protected static $host = 'localhost';

    protected static $user = 'user';

    protected static $password = '12345';

    protected static $dbName = 'my_database';

    protected static $connection;

    private function __construct() {

    }

    public static function getInstance() {
        if (!self::$connection) {
            self::$connection = new mysqli(self::$host, self::$user, self::$password, self::$dbName);
        }
        return self::$connection;
    }

}
?>
{% endhighlight %}

And there you have it. Your traditional, boring, just-global-state-encapsulating Singleton; this one
returning a <code>mysqli</code> database connection. I'm sure you've written code like this before, I
know I have.

Now, let's take a look at a simple class skeleton that might map to a database table for users.
We aren't gonna actually write out any SQL or anything like that; just an example of where our
<code>NastyOlSingleton</code> might be used.

{% highlight php %}
<?php

class UserTable {

    protected $Connection;

    public function __construct() {
        $this->Connection = NastyOlSingleton::getInstance();
    }

    public function createNewUser($userInfo) {
        return $this->Connection->create($userInfo);
    }

    public function findUserById($userId) {
        return $this->Connection->read($userId);
    }

}

?>
{% endhighlight %}

There you have it, some poor victim being abused by <code>NastyOlSingleton</code>. Important to
note, after you weep for the innocent, is that we are hiding our dependency. The average onlooker
would not be aware that beneath this seemingly benign code lies the requirement for a database connection!
<a href="http://stackoverflow.com/users/208809/gordon">Gordon</a>, a Stack Overflow member, said,
"Applications with no depedencies don't exist. I just want them to be manageable and explicit."

I would say that our dependencies are neither manageable or explicit.

### the problem with this approach

We've now tied our application to the concreate implementation of <code>NastyOlSingleton</code>.
Further more, our application architecture is setup so that anything can gain access to the database.
Since the object is available everywhere it won't hurt if we just use it in the view just this one time
because we're behind on a deadline. It doesn't matter that objects everywhere in our application are
using our database all willy-nilly with no regards to the sanctity of our data.  Since we're so
awesome we also don't need to unit test so don't worry about the problems static makes in that department.

As you can see, global state isn't friendly. It can lead to bad code and, even worse, **bad
design decisions**. Is all code that uses Singleton and global state *bad*?  No, but
I would venture that it leads to easier bad design decisions then solutions where the problem was thought
through in such a manner that didn't require global state.

### the solution

For this particular problem there is an easy, elegant solution that utilizes the [Factory design pattern](http://sourcemaking.com/design_patterns/factory_method)
and, you guessed it, Dependency Injection.  Whenever I see somebody utilizing
a Singleton I think to myself that a Factory should probably be responsible for producing that object.
The calling code shouldn't really care at all if the object being used is an instance shared among other
objects or one created just for its own special use. Let the Factory be responsible for dictating whether
or not an object instance is shared. Then remove all those crappy <code>static</code> methods and
properties from your classes.

Let's take a look at some more code. This time a Factory that will produce objects like <code>UserTable</code>.
Note that in the constructor we're explicitly stating, "Hey, guys, I need a database connection over here."

{% highlight php %}
<?php

class DbTableFactory {

    protected $Connection;

    public function __construct(msyqli $Connection) {
        $this->Connection = $Connection;
    }

    public function getObject($tableName) {
        return new $tableName($this->Connection);
    }

}

?>
{% endhighlight %}

And of course we should change up our <code>UserTable</code> class to match up with our new and improved
Dependecy Injection.

{% highlight php %}
<?php

class UserTable {

    protected $Connection;

    public function __construct(mysqli $Connection) {
        $this->Connection = $Connection;
    }

    public function createNewUser($userInfo) {
        return $this->Connection->create($userInfo);
    }

    public function findUserById($userId) {
        return $this->Connection->read($userId);
    }

}

?>
{% endhighlight %}

What about <code>NastyOlSingleton</code>?

<img src="/img/nuclear_explosion.jpg" title="Destroy the Singleton.  Perhaps even with a fire." alt="Destroy the Singleton.  Perhaps even with a fire." class="center-block" width="400" height="340" />

### wait, what are we really gaining here?

As you can see the <code>UserTable</code> hasn't really changed all that much on the inside.  Its
still calling the same methods in the same ways. But, it has that very, very important constructor
dependency; effectively communicating that this object needs a <code>mysqli</code> connection or it
is useless. This leaves you with a much more flexible solution, you can create that database connection
however you want. Perhaps you have another Factory taking care of actually creating the connection.

Most importantly though you're no longer exposing the database to all the things.  Only the objects
that truly need to access the database have the ability to do so.  When you start seeing weird data
showing up in queries you'll thank yourself that you have a limited number of objects that can be
responsible. Oh, and as a little bonus you have more control over how your database connection is
handled and the side effects stemming from its use. For example, you might want to throw exceptions
instead of triggering an error for a given connection.

### wrapping it up

Ultimately the code examples here are pretty simple because the basic idea here is pretty simple.
Global state, and by extension Singleton, is bad. Its bad for a lot of different reasons; leads to
entangling of concerns, makes easier to choose bad design decisions, and makes unit testing a nightmare.
The best way to avoid global state and that NastyOlSingleton is to use Dependency Injection and build
your application so you're more inclined to make *good* design decisions as compared to bad
ones.

<a href="{% post_url 2012-01-24-why-you-should-use-DI %}">Return to why you should use DI</a>