---
layout: post
title:  "How market research consultants turn Venn diagram concept to derived importance analysis"
date:   2020-02-03 18:05:55 +0300
image:  '/assets/img/derived_analysis.jpg'
tags:   research
---

The brand-marketing team typically considers "the imagery" while launching a product and/or updating the marketing strategy. As a key factor influencing consumers to consider making a purchase, it is important to make sure that brand image is consistent with consumer thought. Ideally, prospective brand image inquired from qualitative study and later it is relaunched in a wider sample with quantitative approach. 
<img src= 'https://github.com/kiranaananda/portfolio/blob/gh-pages/assets/img/importance_analysis.jpg' style="vertical-align:middle;margin:0px 0px">
In the interest of getting better picture of attribute competitiveness, market researcher needs to address each score of (1) stated importance and (2) derived importance first before suggesting on what should be listed for baseline in creating a unique-value-positioning.  The score of (1) stated importance and (2) derived importance later poured into 4 quadrants:

Spotlight area
- Key driver	: (1) & (2) both above average
- Hygienic	: (1) above average, (2) below average

Periphery area
- Opportunity	: (1) below average, (2) above average
- Low priority	: (1) & (2) both below average

One of familiar way to address derived importance could use Jaccard similarity coefficient. Jaccard similarity is written in set notation using the intersection and union:
<p style="text-align: center;"><img src="https://i2.wp.com/www.displayr.com/wp-content/uploads/2018/09/Jaccard-formula.png?zoom=1.5&amp;resize=137%2C55&amp;ssl=1" alt="" width="150" height="60" style="vertical-align:middle;margin:0px 0px"/></p>
The implication of the formula is:
- A= brands used in the past month(s), e.g. “Which, if any, of the following pasteurized milk brands do you consume in the past 1 month?”
- B = attributes by brand, e.g. “Which, if any, of the following attributes do you think owned by the brands below?” 

**How to Run**

<a href="https://docs.google.com/spreadsheets/d/1qKEw-h1_iaIZQ-4PTzTFkp3-qVxk0uGD/edit?usp=share_link&amp;ouid=106328679956588939832&amp;rtpof=true&amp;sd=true">Here</a> is the dataset (due to confidentiality I can not show the real brand name) that performed to obtain the importance analysis. Basically, the step is just calculating the percent of those who have matching score between brand used and imagery portrayed within respective brand.
Another way to do it in python scripts can be done with:

{% highlight ruby %}
import pandas as pd
import numpy as np
importance = pd.read_excel('Derived Importance Example.xlsx', 'Raw Data')
importance = importance.iloc [:1800]
brand_used = list(importance.columns)[1:15]
attribute_intersection = set(["_".join(col.split('_')[:2]) for col in list(importance.columns)[16:100]])
parent_dict = dict((col, []) for col in attribute_intersection)
for index in importance.index:
    for p_col in attribute_intersection:
        trigger = False
        for m_col in brand_used:
            m_col_idx = m_col.split('_')[-1]
            p_col_idx = p_col + '_' + m_col_idx
            if importance.loc[index, m_col] == importance.loc[index, p_col_idx]:
                trigger = True
                break
        parent_dict[p_col].append(trigger)
derived_analysis=pd.DataFrame(parent_dict)
derived_analysis.to_excel('Derived Importance Example - Processed.xlsx', index=False)
{% endhighlight %}

**Key Take-out**

Data explained mother with kids tended to be influenced by taste (key driver) and price (hygienic) in selecting pasteurized milk for their kids. Thus, creative implication could be something like these:
- Taste-worthy, worth the money!
- Good taste, good price!
- Guaranteed taste in affordable price!

However, need to consider other aspects before deciding so,
- Was the nature of the target market being a promo driver? If yes, it’ll be risky persuading by price as there is an indication that they won’t be loyal. Hence, instead putting price under promo, better to mix it with something sounds relative e.g., “cheaper price” rather than “always on sale”
- Is it aimed for tactical (short-term) or thematic (long-term) campaign? Again, it is never recommended to put absolute price as UVP if strategy is about to reach sustainability.
- Is it a real portrait of your brand? Brand can always be narcissists by putting “X-est” or “most X”. Hence, if by default can not compete on price, better not to word by self-perceiving supreme. 

**The Final Leg**

Not all we think ideal is the fittest. It is not mandatory to pick the attributes by importance, especially if the team find some attributes are possibly to be trendsetter – typically is reflective under opportunity area. In that instance, marketers may not always have to connect with customer on preferred area, they can bring up new value that could drive customers to come with understanding about “trendsetter” significance.

