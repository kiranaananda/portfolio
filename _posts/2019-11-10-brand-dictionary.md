---
layout: post
title:  'Cost Reduction 101: Simple Code to Code Top of Mind'
date:   2019-11-10 18:05:55 +0300
image:  '/assets/img/brand dictionary.jpg'
tags:   research
---

Unlike offline survey where question is being read and the interviewer coded the answers during assessment, in online survey, it is very less likely for a platform to store pre-coded response of an open question. While it is possible with machine learning, I think that the cost to build with NLP will not be smaller than leaving the junior researcher to code the answers manually when the report demands quantified result. 

Maybe the task still doable in countries where literacy number is above average, but this is something far from expectation when someone is being a researcher with Indonesia participants.  Indonesia language has complexity in formal and informal style in form of articles, direct conversation, and digital communication. Here is the example to say, “I think that this would help in improving your logic skills”.

<table>
<tbody>
<tr>
<td width="293">
<p>Formal (articles)</p>
</td>
<td width="308">
<p>Menurutku hal ini akan membantumu meningkatkan kemampuan logika.</p>
</td>
</tr>
<tr>
<td width="293">
<p>Informal (direct conversation - general)</p>
</td>
<td width="308">
<p>Menurutku ini akan ngebantu ningkatin skill logika kamu.</p>
</td>
</tr>
<tr>
<td width="293">
<p>Informal (digital conversation &ndash; Jakartan style)</p>
</td>
<td width="308">
<p>Ini bakal ngebantu lo ningkatin skill logika.</p>
</td>
</tr>
<tr>
<td width="293">
<p>Informal (digital communication &ndash;2010+)</p>
</td>
<td width="308">
<p>Ini bkal ngebntu lo nngkatin skill logic.</p>
</td>
</tr>
<tr>
<td width="293">
<p>Informal (digital communication &ndash;2010-)</p>
</td>
<td width="308">
<p>iN1 BkAL nGeBnTu LoE NiNgKtn SkiL LogiK4 qMue</p>
</td>
</tr>
</tbody>
</table>

With that quick volution in language styling, it is most likely to happen that people are making typo due to the history that typing incorrectly was viral back then. So, in a survey, possible to happen that a response consists of some variation of brand name. I will use a brand “Frisian Flag” as example. Possible typing that come when aiming to answers with “Frisian Flag” would be:
- Fresyen fleg
- Frsan flag
- Frisian pleg
- Presen plek
- Bendera
- Bndera
- Fr1sian
and many more…

Hence, when handling a tracking study, I usually done it with python and store the typo as future reference for the upcoming wave. Usually, it cost Rp 175 per cell if involving vendor to help to code it, and approximately 1/2 seconds to put the code via spreadsheet if done standalone. However, with python, it could be quicker than doing manually. I save many hours by this method.

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
survey.to_excel(surveyfile coded.xlsx', index=False)
{% endhighlight %}
