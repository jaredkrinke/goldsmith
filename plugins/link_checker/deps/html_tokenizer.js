const DEFAULT_ENTITIES = {
    'quot': '\u0022',
    'amp': '\u0026',
    'lt': '\u003C',
    'gt': '\u003E',
    'nbsp': '\u00A0'
};
Object.freeze(DEFAULT_ENTITIES);
const getOpeningTag = chunker(/(<(([a-z0-9-]+:)?[a-z0-9-]+))/ig);
const getText = chunker(/([^<]+)/g);
const getClosingTag = chunker(/(<\/(([a-z0-9-]+:)?[a-z0-9-]+)>)/ig);
const getCommentOpen = chunker(/(<!--)/g);
const getComment = chunker(/(([\s\S]*?)-->)/g);
const getScript = chunker(/(([\s\S]*?)<\/script>)/g);
const getTagEnd = chunker(/(\s*(\/?>))/g);
const getAttributeName = chunker(/(\s+(([a-z0-9\-_]+:)?[a-z0-9\-_]+)(\s*=\s*)?)/ig);
function chunker(regex) {
    return (str, pos)=>{
        regex.lastIndex = pos;
        const match = regex.exec(str);
        if (!match || match.index !== pos) {
            return undefined;
        } else {
            return {
                length: match[1].length,
                match
            };
        }
    };
}
const PATTERN = /(\s*([^>\s]*))/g;
const QUOTES = new Set('"\'');
function readAttribute(str, pos) {
    const quote = str.charAt(pos);
    const pos1 = pos + 1;
    if (QUOTES.has(quote)) {
        const nextQuote = str.indexOf(quote, pos1);
        if (nextQuote === -1) {
            return {
                length: str.length - pos,
                value: str.substring(pos1)
            };
        } else {
            return {
                length: nextQuote - pos + 1,
                value: str.substring(pos1, nextQuote)
            };
        }
    } else {
        PATTERN.lastIndex = pos;
        const match = PATTERN.exec(str) || [];
        return {
            length: match[1].length,
            value: match[2]
        };
    }
}
const PATTERN1 = /&(#?)([a-z0-9]+);/ig;
const HANDLERS = new WeakMap();
function getHandler(map) {
    let handler = HANDLERS.get(map);
    if (!handler) {
        const callback = function(ent, isNum, content) {
            if (isNum) {
                const num = content.charAt(0) === 'x' ? parseInt('0' + content, 16) : parseInt(content, 10);
                return String.fromCharCode(num);
            } else {
                return map[content] || ent;
            }
        };
        handler = (text)=>{
            return text.indexOf('&') > -1 ? text.replace(PATTERN1, callback) : text;
        };
        HANDLERS.set(map, handler);
    }
    return handler;
}
function deentify(text, map) {
    const handler = getHandler(map);
    return handler(text);
}
class Tokenizer1 {
    entityMap;
    static tokenize(html, opts = {
    }) {
        const tokenizer = new Tokenizer1(opts);
        return tokenizer.tokenize(html);
    }
    static from(opts) {
        return new Tokenizer1(opts);
    }
    constructor(opts){
        this.entityMap = {
            ...DEFAULT_ENTITIES,
            ...opts.entities
        };
        Object.freeze(this);
    }
    *tokenize(html) {
        let currentText;
        for (const tkn of this._tokenize(html)){
            if (tkn.type === 'text') {
                const text = tkn.text;
                if (currentText === undefined) {
                    currentText = text;
                } else {
                    currentText += text;
                }
            } else {
                if (currentText) {
                    const deentText = deentify(currentText, this.entityMap);
                    yield {
                        type: 'text',
                        text: deentText
                    };
                    currentText = undefined;
                }
                yield tkn;
            }
        }
    }
    *_tokenize(html) {
        yield {
            type: 'start'
        };
        let pos = 0;
        let state = 'inText';
        let currentTag = '';
        let next;
        while(pos < html.length){
            if (state === 'inText') {
                const isBracket = html.charAt(pos) === '<';
                if (isBracket && (next = getOpeningTag(html, pos))) {
                    pos += next.length;
                    currentTag = next.match[2];
                    yield {
                        type: 'opening-tag',
                        name: currentTag
                    };
                    state = 'inTag';
                } else if (isBracket && (next = getClosingTag(html, pos))) {
                    pos += next.length;
                    yield {
                        type: 'closing-tag',
                        name: next.match[2]
                    };
                } else if (isBracket && (next = getCommentOpen(html, pos))) {
                    pos += next.length;
                    state = 'inComment';
                } else if (next = getText(html, pos)) {
                    pos += next.length;
                    yield {
                        type: 'text',
                        text: next.match[1]
                    };
                } else {
                    const text = html.substring(pos, pos + 1);
                    pos += 1;
                    yield {
                        type: 'text',
                        text
                    };
                }
            } else if (state === 'inComment') {
                if (next = getComment(html, pos)) {
                    pos += next.length;
                    yield {
                        type: 'comment',
                        text: next.match[2]
                    };
                    state = 'inText';
                } else {
                    yield {
                        type: 'comment',
                        text: html.substring(pos)
                    };
                    break;
                }
            } else if (state === 'inScript') {
                if (next = getScript(html, pos)) {
                    pos += next.length;
                    yield {
                        type: 'text',
                        text: next.match[2]
                    };
                    yield {
                        type: 'closing-tag',
                        name: 'script'
                    };
                    state = 'inText';
                } else {
                    yield {
                        type: 'text',
                        text: html.substring(pos)
                    };
                    break;
                }
            } else if (state === 'inTag') {
                if (next = getAttributeName(html, pos)) {
                    pos += next.length;
                    const name = next.match[2];
                    const hasVal = next.match[4];
                    if (hasVal) {
                        const read = readAttribute(html, pos);
                        pos += read.length;
                        yield {
                            type: 'attribute',
                            name,
                            value: deentify(read.value, this.entityMap)
                        };
                    } else {
                        yield {
                            type: 'attribute',
                            name,
                            value: ''
                        };
                    }
                } else if (next = getTagEnd(html, pos)) {
                    pos += next.length;
                    const token = next.match[2];
                    yield {
                        type: 'opening-tag-end',
                        name: currentTag,
                        token
                    };
                    state = currentTag === 'script' ? 'inScript' : 'inText';
                } else {
                    state = 'inText';
                }
            } else {
                break;
            }
        }
        yield {
            type: 'done'
        };
    }
}
export { Tokenizer1 as Tokenizer };
class Stack {
    items;
    constructor(){
        this.items = [];
    }
    push(t) {
        this.items.push(t);
    }
    pop() {
        return this.items.pop();
    }
    peek(n = 0) {
        const idx = this.items.length + -1 + -n;
        return this.items[idx];
    }
    size() {
        return this.items.length;
    }
    *drain() {
        for(let i = this.items.length; i > 0; i--){
            yield this.items[i - 1];
        }
        this.items.length = 0;
    }
}
const SELF_CLOSING_TAGS = new Set([
    'area',
    'base',
    'br',
    'col',
    'command',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr', 
]);
const CLOSED_BY_PARENTS = new Set([
    'p',
    'li',
    'dd',
    'rb',
    'rt',
    'rtc',
    'rp',
    'optgroup',
    'option',
    'tbody',
    'tfoot',
    'tr',
    'td',
    'th', 
]);
const CLOSED_BY_SIBLINGS = {
    p: new Set([
        'address',
        'article',
        'aside',
        'blockquote',
        'div',
        'dl',
        'fieldset',
        'footer',
        'form',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'header',
        'hgroup',
        'hr',
        'main',
        'nav',
        'ol',
        'p',
        'pre',
        'section',
        'table',
        'ul', 
    ]),
    li: new Set([
        'li'
    ]),
    dt: new Set([
        'dt',
        'dd'
    ]),
    dd: new Set([
        'dt',
        'dd'
    ]),
    rb: new Set([
        'rb',
        'rt',
        'rtc',
        'rp'
    ]),
    rt: new Set([
        'rb',
        'rt',
        'rtc',
        'rp'
    ]),
    rtc: new Set([
        'rb',
        'rtc',
        'rp'
    ]),
    rp: new Set([
        'rb',
        'rt',
        'rtc',
        'rp'
    ]),
    optgroup: new Set([
        'optgroup'
    ]),
    option: new Set([
        'option',
        'optgroup'
    ]),
    thead: new Set([
        'tbody',
        'tfoot'
    ]),
    tbody: new Set([
        'tbody',
        'tfoot'
    ]),
    tfoot: new Set([
        'tbody'
    ]),
    tr: new Set([
        'tr'
    ]),
    td: new Set([
        'td',
        'th'
    ]),
    th: new Set([
        'td',
        'th'
    ])
};
function isSelfClosing(tag) {
    return SELF_CLOSING_TAGS.has(tag);
}
function isClosedBy(tag, otherTag) {
    return CLOSED_BY_SIBLINGS[tag]?.has(otherTag) ?? false;
}
function isClosedByParent(tag) {
    return CLOSED_BY_PARENTS.has(tag);
}
class Parser1 {
    tokenizer;
    static parse(html, opts = {
    }) {
        const parser = new Parser1(opts);
        return parser.parse(html);
    }
    static from(opts) {
        return new Parser1(opts);
    }
    constructor(opts){
        this.tokenizer = Tokenizer1.from(opts);
        Object.freeze(this);
    }
    *parse(html) {
        const tkzr = this.tokenizer;
        const stack = new Stack();
        let pendingTag = undefined;
        for (const tkn of tkzr.tokenize(html)){
            if (tkn.type === 'opening-tag') {
                pendingTag = {
                    name: tkn.name,
                    attributes: {
                    }
                };
            } else if (tkn.type === 'closing-tag') {
                const current = stack.peek();
                const parent = stack.peek(1);
                if (current) {
                    if (current.name === tkn.name) {
                        stack.pop();
                        yield {
                            type: 'close',
                            name: current.name,
                            selfClosing: false
                        };
                    } else {
                        if (parent && parent.name === tkn.name && isClosedByParent(current.name)) {
                            stack.pop();
                            yield {
                                type: 'close',
                                name: current.name,
                                selfClosing: false
                            };
                            stack.pop();
                            yield {
                                type: 'close',
                                name: parent.name,
                                selfClosing: false
                            };
                        }
                    }
                }
            } else if (tkn.type === 'opening-tag-end') {
                if (pendingTag) {
                    const mightBeClosed = stack.peek();
                    const isSelfClose = tkn.token === '/>' || isSelfClosing(tkn.name);
                    if (mightBeClosed && isClosedBy(mightBeClosed.name, pendingTag.name)) {
                        stack.pop();
                        yield {
                            type: 'close',
                            name: mightBeClosed.name,
                            selfClosing: false
                        };
                    }
                    yield {
                        type: 'open',
                        name: pendingTag.name,
                        attributes: pendingTag.attributes,
                        selfClosing: isSelfClose
                    };
                    if (isSelfClose) {
                        yield {
                            type: 'close',
                            name: pendingTag.name,
                            selfClosing: true
                        };
                    } else {
                        stack.push(pendingTag);
                    }
                } else {
                    yield {
                        type: 'text',
                        text: tkn.token
                    };
                }
            } else if (tkn.type === 'text') {
                yield tkn;
            } else if (tkn.type === 'comment') {
                yield tkn;
            } else if (tkn.type === 'attribute') {
                if (pendingTag) {
                    pendingTag.attributes[tkn.name] = tkn.value;
                }
            }
        }
        for (const next of stack.drain()){
            yield {
                type: 'close',
                name: next.name,
                selfClosing: false
            };
        }
    }
}
export { Parser1 as Parser };

