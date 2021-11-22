
/**
 * Opening tag chunker function.
 */
export declare const getOpeningTag: (str: string, pos: number) => {
    length: number;
    match: RegExpExecArray;
} | undefined;
/**
 * Text node chunker function.
 */
export declare const getText: (str: string, pos: number) => {
    length: number;
    match: RegExpExecArray;
} | undefined;
/**
 * Closing tag chunker function.
 */
export declare const getClosingTag: (str: string, pos: number) => {
    length: number;
    match: RegExpExecArray;
} | undefined;
/**
 * Comment open chunker function.
 */
export declare const getCommentOpen: (str: string, pos: number) => {
    length: number;
    match: RegExpExecArray;
} | undefined;
/**
 * Comment content chunker function.
 */
export declare const getComment: (str: string, pos: number) => {
    length: number;
    match: RegExpExecArray;
} | undefined;
/**
 * Script content chunker function.
 */
export declare const getScript: (str: string, pos: number) => {
    length: number;
    match: RegExpExecArray;
} | undefined;
/**
 * End tag chunker function.
 */
export declare const getTagEnd: (str: string, pos: number) => {
    length: number;
    match: RegExpExecArray;
} | undefined;
/**
 * Attribute name chunker function.
 */
export declare const getAttributeName: (str: string, pos: number) => {
    length: number;
    match: RegExpExecArray;
} | undefined;
//# sourceMappingURL=chunks.d.ts.map
import * as types from './types';
/**
 * Replace entities within a chunk of text with the
 * characters they represent.
 */
export default function deentify(text: string, map: types.Entities): string;
//# sourceMappingURL=deentify.d.ts.map
import { Entities } from './types';
declare const DEFAULT_ENTITIES: Entities;
/**
 * A small set of the most common entities for use during parsing.
 */
export default DEFAULT_ENTITIES;
//# sourceMappingURL=default-entities.d.ts.map
import { Entities } from './types';
/**
 * A large set of possible entities for use during parsing.
 */
declare const entities: Entities;
export default entities;
//# sourceMappingURL=entities.d.ts.map
export * from './parser';
export * from './tokenizer';
export * from './types';
//# sourceMappingURL=index.d.ts.map
import { Entities } from './types';
/**
 * Options passed to a parser on instantiation.
 */
export interface ParserOptions {
    entities?: Entities;
}
/**
 * A token emitted during a parsing run.
 */
export declare type ParseToken = OpenParseToken | TextParseToken | CommentParseToken | CloseParseToken;
/**
 * Opening tag.
 */
export interface OpenParseToken {
    type: 'open';
    /** Name of tag. */
    name: string;
    /** Set of attributes. */
    attributes: Attributes;
    /** Whether this tag is self-closing. */
    selfClosing: boolean;
}
/**
 * Text token.
 */
export interface TextParseToken {
    type: 'text';
    /** The text content. */
    text: string;
}
/**
 * Comment.
 */
export interface CommentParseToken {
    type: 'comment';
    /** The comment content. */
    text: string;
}
/**
 * Closing tag.
 */
export interface CloseParseToken {
    type: 'close';
    /** Name of the tag. */
    name: string;
    /** Whether tag was self closing. */
    selfClosing: boolean;
}
/**
 * A set of attributes.
 */
export interface Attributes {
    [attrName: string]: string;
}
/**
 * An object capable of parsing HTML.
 */
export declare class Parser {
    private readonly tokenizer;
    /**
     * Static method to parse HTML without instantiating a Parser instance.
     * @param html HTML string to parse.
     * @param opts Optional parser configuration options.
     */
    static parse(html: string, opts?: ParserOptions): IterableIterator<ParseToken>;
    /**
     * Static factory to create a parser.
     * @param opts Parser options.
     */
    static from(opts: ParserOptions): Parser;
    private constructor();
    /**
     * Parse an HTML string. Returns an iterator, thus allowing parse
     * tokens to be consumed via for/of or other iteration mechanisms.
     * @param html HTML string to parse.
     */
    parse(html: string): IterableIterator<ParseToken>;
}
//# sourceMappingURL=parser.d.ts.map
/**
 * Extract an attribute from a chunk of text.
 */
export default function readAttribute(str: string, pos: number): {
    length: number;
    value: string;
};
//# sourceMappingURL=read-attribute.d.ts.map
/**
 * Mutable FILO stack object.
 */
export default class Stack<T> {
    private items;
    constructor();
    push(t: T): void;
    pop(): T | undefined;
    peek(n?: number): T | undefined;
    size(): number;
    drain(): IterableIterator<T>;
}
//# sourceMappingURL=stack.d.ts.map
import { Entities } from './types';
/**
 * Options passed to a tokenizer on instantiation.
 */
export interface TokenizerOptions {
    entities?: Entities;
}
/**
 * A token emitted during a tokenizing run.
 */
export declare type Token = StartToken | OpeningTagToken | AttributeToken | OpeningTagEndToken | TextToken | CommentToken | ClosingTagToken | DoneToken;
/**
 * Start of tokenizing run.
 */
export interface StartToken {
    type: 'start';
}
/**
 * Beginning of opening tag.
 */
export interface OpeningTagToken {
    type: 'opening-tag';
    name: string;
}
/**
 * Attribute.
 */
export interface AttributeToken {
    type: 'attribute';
    name: string;
    value: string;
}
/**
 * End of opening tag.
 */
export interface OpeningTagEndToken {
    type: 'opening-tag-end';
    name: string;
    token: '>' | '/>';
}
/**
 * Text node chunk.
 */
export interface TextToken {
    type: 'text';
    text: string;
}
/**
 * Comment.
 */
export interface CommentToken {
    type: 'comment';
    text: string;
}
/**
 * Closing tag.
 */
export interface ClosingTagToken {
    type: 'closing-tag';
    name: string;
}
/**
 * End of tokenizing run.
 */
export interface DoneToken {
    type: 'done';
}
/**
 * A low-level tokenizer utility used by the HTML parser.
 */
export declare class Tokenizer {
    private readonly entityMap;
    /**
     * Static method to tokenize HTML without instantiating a Tokenizer instance.
     * @param html HTML string to tokenize.
     * @param opts Optional tokenizer configuration options.
     */
    static tokenize(html: string, opts?: TokenizerOptions): IterableIterator<Token>;
    /**
     * Static factory to create a tokenizer.
     * @param opts Tokenizer options.
     */
    static from(opts: TokenizerOptions): Tokenizer;
    private constructor();
    /**
     * Tokenize an HTML string. Returns an iterator, thus allowing
     * tokens to be consumed via for/of or other iteration mechanisms.
     * @param html HTML string to tokenize.
     */
    tokenize(html: string): IterableIterator<Token>;
    private _tokenize;
}
//# sourceMappingURL=tokenizer.d.ts.map
/**
 * A map of entity names to their character values. Passed
 * to a parser or tokenizer on instantiation.
 */
export interface Entities {
    [name: string]: string;
}
//# sourceMappingURL=types.d.ts.map
/**
 * Determine whether a tag is a self-closing tag.
 */
export declare function isSelfClosing(tag: string): boolean;
/**
 * Determine whether a tag is closed by another tag
 */
export declare function isClosedBy(tag: string, otherTag: string): boolean;
/** Determine whether a tag is auto-closed by its parent. */
export declare function isClosedByParent(tag: string): boolean;
//# sourceMappingURL=util.d.ts.map
