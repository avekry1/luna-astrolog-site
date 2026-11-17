export const CONFIG=Object.freeze({defaultCode:'lp_site',links:{telegram:'https://t.me/AstroLunaai_bot?start={code}',vk:'https://vk.me/lunaastrolog?ref={code}',max:'https://max.ru/id772171256698_bot?start={code}'},legal:{offer:'',privacy:'',support:''},chartsCount:null});
export const TOPICS={
 general:{main:'Спроси астролога',accent:'о главном',ask:'Что меня ждёт в ближайшие месяцы?',answer:'Анна, твоя Луна в Раке. Посмотрим, какой период у тебя начинается и что он откроет.'},
 rel:{main:'Почему в любви',accent:'всё повторяется?',ask:'Почему я всё время выбираю не тех?',answer:'Анна, твоя Луна в Раке. Ты ищешь глубину, а выбираешь тех, кто держит дистанцию.'},
 money:{main:'Где твоё дело',accent:'и твои деньги?',ask:'Почему деньги не задерживаются?',answer:'Анна, твоя Луна в Раке. Ты заботишься обо всех, кроме себя. Отсюда и утечка денег.'},
 path:{main:'В чём твоя сила',accent:'и куда двигаться?',ask:'В чём моё предназначение?',answer:'Анна, твоя Луна в Раке. Твоя сила в чутье к людям. Разберём, где оно раскроется.'},
 mood:{main:'Откуда эта усталость',accent:'и на что опереться?',ask:'Почему я так устаю в последнее время?',answer:'Анна, твоя Луна в Раке. Ты берёшь на себя чужие чувства. Разберём, на что опереться.'}
};
export function validCode(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(value)?value:CONFIG.defaultCode;}
export function topicForCode(value){const prefix=validCode(value).split('_')[0];return Object.hasOwn(TOPICS,prefix)?prefix:'general';}
export function linkFor(platform,code){const template=CONFIG.links[platform];return template?template.replaceAll('{code}',encodeURIComponent(validCode(code))):'';}
