---
layout: post
title:  'Cost reduction 101: python code to code top of mind'
date:   2019-11-10 18:05:55 +0300
image:  '/assets/img/brand%20dictionary.jpg'
tags:   research
---

Unlike an offline survey where questions are read and the interviewer codes the answers during assessment, in an online survey, it is very unlikely for a platform to store pre-coded responses to an open question. While it is possible with machine learning, I think that the cost to build with NLP will not be cheaper than leaving the junior researcher to code the answers manually when the report demands quantified results.

Maybe the task is still doable in countries where literacy numbers are above average, but this is far from expected when Indonesian participants give gibberish answers. The Indonesian language has complexity in both formal and informal styles in the form of articles, direct conversation, and digital communication. Here is the example to say, "I think that this would help in improving your logic skills".
- Formal (articles): Menurutku hal ini akan membantumu meningkatkan kemampuan logika.
- Informal (direct conversation - general): Menurutku ini akan ngebantu ningkatin skill logika kamu.
- Informal (digital conversation – Jakartan style): Ini bakal ngebantu lo ningkatin skill logika.
- Informal (digital communication –2010+): Ini bkal ngebntu lo nngkatin skill logic.
- Informal (digital communication –2010-): iN1 BkAL nGeBnTu LoE NiNgKtn SkiL LogiK4 qMue

With that quick evolution in language styling, it is most likely to happen that people make typos due to the fact that typing incorrectly was viral back then. So, in a survey where a response consists of some variation of the brand name, it is possible to get the common spelling inaccuracy. I will use the brand "Frisian Flag" as an example. Possible typing that comes up when aiming to answer with "Frisian Flag" would be:
- Fresyen fleg
- Frsan flag
- Frisian pleg
- Presen plek
- Bendera
- Bndera
- Fr1sian
and many more…

Hence, when handling a tracking study, I usually do it with Python and store the typo as a future reference for the upcoming wave. Usually, it costs Rp 175 per cell if involving a vendor to help code it, and approximately 1/2 second to put the code into a cell if done standalone. However, with Python, it could be quicker than doing it manually. I save many hours by using this method.

{% highlight ruby %}
import re
import pandas as pd
import numpy as np
from nltk.tokenize import word_tokenize
%matplotlib inline
survey = pd.read_excel('surveyfile.xlsx', sheet_name = 0)
col_list = []
for col in survey.columns:
    if survey[col].dtypes == 'object':
        col_list.append(col)
for col in survey.columns:
    if survey[col].dtypes == 'object':
        survey[col] = survey[col].astype(str)
        survey[col] = survey[col].str.lower()
survey_value = survey[col_list].values
brand = list()
for brand_list in survey_value:
    brand.extend(brand_list)
brand_unique = list(set(brand))
label_dict = {
 'wendi cagur':58, #put your dictionary here
 'wendy cagur':58, #put your dictionary here
 'wndi cagur':58, #put your dictionary here
 'yang mi':93, #put your dictionary here
 'yang yang':93, #put your dictionary here
 'yoo seung ho':93 #put your dictionary here
}
label_dict = dict((k.lower(), v) for k, v in label_dict.items())
set(brand_unique) - set(label_dict.keys())
survey['like_1'] = survey.pertama.map(label_dict) #identify your column here
survey['like_2'] = survey.kedua.map(label_dict) #identify your column here
survey['like_3'] = survey.ketiga.map(label_dict) #identify your column here
survey.to_excel('surveyfile coded.xlsx', index=False)
{% endhighlight %}
