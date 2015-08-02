---
layout: posts
title: spaghetti triage
description: A look at what should be the first thing you fix in a code full of spaghetti
author: Charles Sprayberry
published: true
category: programming
redirect_from:
  - /2012/03/13/spaghetti-triage.html

disqus_enabled: true
disqus_shortname: ramblingsofaphpenthusiast
disqus_identifier: /2012/03/13/spaghetti-triage.html
disqus_url: http://cspray.github.com/2012/03/13/spaghetti-triage.html
---

I was having lunch today with a fellow developer and the conversation included flawed web-based systems.
Systems in which there are fundamental flaws and there are numerous issues to fix.  Imagine a typical
spaghetti-fied, insecure mess.  I asked the guy what he would fix first.  His answer was, in principle,
the same as my answer...separate concerns, especially getting the "view" out of the business logic.

This got me thinking.  Why did I choose that specific problem to fix first?  Why not fix common security
issues, like [SQL Injection](http://en.wikipedia.org/wiki/Sql_injection),
[Cross-Site Scripting](http://en.wikipedia.org/wiki/Cross_site_scripting) and [Remote File Inclusion](http://en.wikipedia.org/wiki/Remote_file_inclusion)?
In this blog post I will discuss why I would choose to separate the view from the business logic first
and give an example in code on how one might begin to separate the templating of HTML in a spaghettified
PHP application.

### why separate the view first?

That's a really good question.  After all, when compared to security vulnerabilities that effect the
validity of your data separating the view seems insignificant in comparison.  However, we must keep
in mind that developers are human too and understanding business logic intermingled with the view, or
HTML, is insanely difficult and time consuming.  Seemingly everything becomes much longer and clunkier
than the business requirements need.  It is also extremely hard to determine how the different parts
of the view scattered through everything comes together to form the whole.  Ultimately this means the
view turns into something you despise.  When you want to work with the view the section you need is
impossible to find and when you don't want to work with the view it is the only thing you see.

We also have to take into account that securing an already established insecure system is going to be
very timely, difficult and error-prone.  Nobody really knows what's going on in code spaghetti.  Was
the user input validated already?  What about formatting or sanitizing the data against some business
logic?  Knowing if you should be doing those things to a particular piece of data at any given time
is pretty important.  After all, [data can become invalid if you escape too much](http://stackoverflow.com/questions/4171318/is-double-escaping-a-string-wrong)
and attempting to format an already formatted value is a waste of resources.  Basically,
security is gonna be easier to implement in a cleanly separated system.

### how would you separate the view?

We have to understand that the answer here is not to go and integrate some advanced
templating system, like [Smarty](http://www.smarty.net/) or [Twig](http://twig.sensiolabs.org/).
While these can be very powerful tools, and I understand why they might be used, I wouldn't consider
them in this situation for 2 reasons.  The first, and most important, being that the last thing you
want to add to an already complex, overladen system is more complexity.  Integrating a third party
system into spaghetti is just not gonna work out well.  Whatever solution is implemented must be simple
and able to be easily absorbed, if you will, by the code base.  The change must be small, gradual and
ultimately would need to be made available globally.  I'm a strong proponent of working within the
local scope, however that isn't what spaghetti is.  Whatever templating system you choose will, initially,
need to be made available to all the things.

The second reason is more a personal preference as it is anything else but quite simply PHP is already
a templating system.  It works with HTML just fine thank you very much and it has [an alternate syntax](http://php.net/manual/en/control-structures.alternative-syntax.php)
that makes for easy addition of simple control and looping structures.  In 5.4 the language also introduces
the [always-on short echo tag feature](http://php.net/ChangeLog-5.php) where a variable can be echod by simply
wrapping it in <code>&lt;?= ?&gt;</code>. PHP is already a templating system, there's no need to add another
one on top of it in most situations.

Looking at all the requirements I would likely start off with a single class and a single public static
method called <code>renderHtml($fileName, $data)</code>.  Let's take a look at actual code that might do this.

{% highlight php %}
<?php

class View {

    protected static $templateDir = '/path/to/your/templates/';

    public static function renderHtml($fileName, array $data) {
        array_walk_recursive($data, 'htmlspecialchars');
        extract($data);
        ob_start();
        include self::$templateDir . $fileName . '.php';
        $output = ob_get_clean();
        return $output;
    }

}

?>
{% endhighlight %}

As you can see there's just not a whole lot that is involed here.  First we make sure all the data
in the array has been properly escaped to prevent XSS attacks.  Then we extract the data in the array
so that the template file has access to the variable data it needs.  Finally, start output buffering,
include the file and return whatever was generated.  Definitely nothing complex but it will allow you
to start separating the view from your business logic.  Once that has been completed other changes will
be much easier to implement.

> I realize the short-tag echo feature, <code>&lt;?= ?&gt;</code>, was available before 5.4.
> However, the feature was only available if you had your PHP INI configuration set to allow short tags.
> Since this feature was dependent on a configuration setting until 5.4 it may not be an option for your
> environment.

### wrapping it up

Well, there's my reasonings for choosing separating business logic from the view as my first spaghetti
triage priority.  I included a simple code example on how I might start disentangling the HTML from the
rest of the PHP code as well.  What would you choose as your first triage priority and why?