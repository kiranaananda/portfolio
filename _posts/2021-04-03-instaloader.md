---
layout: post
title:  "Social media data scraping"
date:   2021-04-03 18:05:55 +0300
image:  '/assets/img/instaloader.jpg'
tags:   research
---

After working with YouGov for the past 2 years, I decided to move to tech company because I found it thrilling working on tracking reports with them. My experience with Gojek somewhat made me wonder regarding what the client would do next with the data. I believed that in order to get the answers, I needed to move to client-side and understand the overall pattern about research use case.
I joined Bukalapak, an e-commerce company which YouGov client at the time. I sit in a position called Marketing Data Insight, where I collaborate closely with data scientist and brand analyst. My very first independent yet mesmerizing project was social media data scraping.

**Background**

E-commerce is a very fast market, and campaigns can run very quickly in a daily timeframe. Bukalapak is not the market leader at the time, and the team would like to better understand what campaigns the competitors are putting effort into, so that we do not fall into the stream and instead establish our own unique position.

**How to**


I coincidentally found a library called Instaloader and I started to read the documentation. There were several walkthroughs that could be followed easily and here was my script after compiling some of the expert suggestion in the discussion.
{% highlight ruby %}
from argparse import ArgumentParser
from glob import glob
from os.path import expanduser
from platform import system
from sqlite3 import OperationalError, connect

try:
    from instaloader import ConnectionException, Instaloader
except ModuleNotFoundError:
    raise SystemExit("Instaloader not found.\n  pip install [--user] instaloader")
    
def get_cookiefile():
    default_cookiefile = {
        "Windows": "~/AppData/Roaming/Mozilla/Firefox/Profiles/*/cookies.sqlite",
        "Darwin": "~/Library/Application Support/Firefox/Profiles/*/cookies.sqlite",
    }.get(system(), "~/.mozilla/firefox/*/cookies.sqlite")
    cookiefiles = glob(expanduser(default_cookiefile))
    if not cookiefiles:
        raise SystemExit("No Firefox cookies.sqlite file found. Use -c COOKIEFILE.")
    return cookiefiles[0]

def import_session(cookiefile, sessionfile):
    print("Using cookies from {}.".format(cookiefile))
    conn = connect(f"file:{cookiefile}?immutable=1", uri=True)
    try:
        cookie_data = conn.execute(
            "SELECT name, value FROM moz_cookies WHERE baseDomain='instagram.com'"
        )
    except OperationalError:
        cookie_data = conn.execute(
            "SELECT name, value FROM moz_cookies WHERE host LIKE '%instagram.com'"
        )
    instaloader = Instaloader(max_connection_attempts=1)
    instaloader.context._session.cookies.update(cookie_data)
    username = instaloader.test_login()
    if not username:
        raise SystemExit("Not logged in. Are you logged in successfully in Firefox?")
    print("Imported session cookie for {}.".format(username))
    instaloader.context.username = username
    instaloader.save_session_to_file(sessionfile)

if __name__ == "__main__":
    p = ArgumentParser()
    p.add_argument("-c", "--cookiefile")
    p.add_argument("-f", "--sessionfile")
    args = p.parse_args()
    try:
        import_session(args.cookiefile or get_cookiefile(), args.sessionfile)
    except (ConnectionException, OperationalError) as e:
        raise SystemExit("Cookie import failed: {}".format(e))

from datetime import datetime
from itertools import dropwhile, takewhile
import instaloader

L = instaloader.Instaloader(post_metadata_txt_pattern="{likes} likes, {comments} comments, {caption} caption.", download_videos=False)

posts = instaloader.Profile.from_username(L.context, "bukalapak").get_posts()

SINCE = datetime(2023, 1, 8) #+1 date of intended date
UNTIL = datetime(2022, 12, 25)

for post in posts:
    if UNTIL < post.date < SINCE:
        L.download_post(post, "bukalapak")
{% endhighlight %}
Once it was downloaded, I run second script to arrange it into a spreadsheet.
{% highlight ruby %}
import os
import pandas as pd
file_names=list(filter(lambda file: file.endswith(".txt"),os.listdir("C:/Users/")))

def read_file(file):
    with open(os.path.join("C:/Users/", file), encoding='utf-8') as f:
        return f.read()

data=[]

for file in file_names:
    caption=read_file(file)
    data.append({'file': file, 'caption': caption})
    
d_data = pd.DataFrame(data)

d_data.to_excel('bukalapak.xlsx', index=False)
{% endhighlight %}

**Final Leg**

It was the time to put researcher worked on content analysis: categorizing the post (could put judgement by either picture, caption, or both) to make the data quantifiable. I categorized it based on definition in our database categories along with
-	Engagement: product display
-	Engagement: education
-	Engagement: game
Later on, I extracted it to Google Studio and created editable dashboard to count the number of interaction by time, brand campaign, category promoted, post per timeframe, and engagement rate. There should be a more advanced method that can be used by involving Artificial Intelligence Research Team to replace manual content analysis. However, due to post range is very dynamic to relatedness between engagement and single product, hence not it is not being pursued at the moment. 

