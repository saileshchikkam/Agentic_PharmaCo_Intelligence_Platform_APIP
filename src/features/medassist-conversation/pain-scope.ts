/** Bounded linguistic scope, not anatomy coding or clinical inference. */
const site='(?:head|back|knee|shoulder|arm|leg|foot|stomach|belly|tummy)';
const exception=new RegExp('^(?:i (?:have|feel) )?no pain(?: anywhere)? (?:apart from|except(?: for)?|other than) (?:in )?(?:my |the |an? )?(?:aching |painful )?'+site+'(?: (?:pain|ache))?$','i');
const fronted=new RegExp('^apart from (?:my |the |an? )?(?:aching|painful) '+site+'$','i');
const nowhere=new RegExp('^there is pain nowhere except in (?:my |the )?'+site+'$','i');
const contrast=new RegExp('\\bno\\s+(?:'+site+'\\s+pain|'+site+'\\s*ache|pain)\\b.*\\bbut\\b.*\\b(?:'+site+'\\s+pain|'+site+'\\s*ache|pain)\\b','i');
export const hasPainException=(quote:string)=>exception.test(quote.trim())||fronted.test(quote.trim())||nowhere.test(quote.trim())||contrast.test(quote.trim());
