---
layout: post
title:  "How market research consultants turn Venn diagram concept to derived importance analysis"
date:   2020-02-03 18:05:55 +0300
image:  '/assets/img/derived_analysis.jpg'
tags:   research
---

The brand-marketing team typically considers "the imagery" when launching a product and/or updating the marketing strategy. As a key factor influencing consumers to consider making a purchase, it is important to make sure that the brand image is consistent with consumer thoughts. Ideally, prospective brand image is inquired about in a qualitative study, and later it is relaunched in a wider sample with a quantitative approach.
<p><img src="https://kiranaananda.github.io/portfolio/assets/img/importance_analysis.jpg" style="vertical-align:middle;margin:0px 0px" /></p>
In the interest of getting a better picture of attribute competitiveness, market researchers need to address each score of (1) stated importance and (2) derived importance first before suggesting what should be listed for baseline in creating a unique value positioning. The score of (1) stated importance and (2) derived importance later poured into four quadrants:

Spotlight area
- Key driver	: (1) & (2) both above average
- Hygienic	: (1) above average, (2) below average

Periphery area
- Opportunity	: (1) below average, (2) above average
- Low priority	: (1) & (2) both below average

One familiar way to address derived importance could be to use the Jaccard similarity coefficient. Jaccard similarity is written in set notation using intersection and union:
<p style="text-align: center;"><img src="https://i2.wp.com/www.displayr.com/wp-content/uploads/2018/09/Jaccard-formula.png?zoom=1.5&amp;resize=137%2C55&amp;ssl=1" alt="" width="150" height="60" style="vertical-align:middle;margin:0px 0px"/></p>
The implication of the formula is:
- A = brands used in the past month(s), e.g., "Which, if any, of the following pasteurized milk brands have you consumed in the past 1 month?"
-B = attributes by brand, e.g., "Which, if any, of the following attributes do you think are owned by the brands below?" 

**How to Run**

<a href="https://docs.google.com/spreadsheets/d/1qKEw-h1_iaIZQ-4PTzTFkp3-qVxk0uGD/edit?usp=share_link&amp;ouid=106328679956588939832&amp;rtpof=true&amp;sd=true"></a> Here is the dataset (due to confidentiality, I cannot show the real brand name) that was used to obtain the importance analysis. Basically, the step is just calculating the percent of those who have a matching score between the brand used and the imagery portrayed within the respective brand.
Another way to do it in Python scripts is with:

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

The data explained that mothers with kids tended to be influenced by taste (key driver) and price (hygienic) in selecting pasteurized milk for their kids. Thus, the creative implication could be something like these:
- Taste-worthy and worth the money!
- Good taste, good price!
- Guaranteed taste at an affordable price!

However, you need to consider other aspects before deciding so,
- Was the nature of the target market a promotional driver? If yes, it’ll be risky persuading by price, as there is an indication that they won’t be loyal. Hence, instead of using price as a promotion, it is better to mix it with something that sounds relative, e.g., "cheaper price" rather than "always on sale."
- Is it aimed at a tactical (short-term) or thematic (long-term) campaign? Again, it is never recommended to put an absolute price on UVP if the strategy is about to reach sustainability.
- Is it a real portrait of your brand? Brands can always be narcissists by putting "X-est" or "most X". Hence, if by default you cannot compete on price, it is better not to word by self-perceiving supreme.

**The Final Leg**

Not everything we think is ideal is the fittest. It is not mandatory to pick the attributes by importance, especially if the team finds a brand that could possibly be a trendsetter, which typically fall under the opportunity area. In that instance, marketers may not always have to connect with customers in their preferred area; they can bring up new value that could drive customers to understand the significance of "trendsetter" status.

