// Module: base64-js@1.2.0
// License: MIT
//
// Module: bluebird@3.4.7
// License: MIT
//
// Module: buffer-shims@1.0.0
// License: MIT
//
// Module: buffer@4.9.1
// License: MIT
//
// Module: core-util-is@1.0.2
// License: MIT
//
// Module: events@1.1.1
// License: MIT
//
// Module: ieee754@1.1.8
// License: BSD-3-Clause
//
// Module: inherits@2.0.1
// License: ISC
//
// Module: inherits@2.0.3
// License: ISC
//
// Module: isarray@1.0.0
// License: MIT
//
// Module: jszip@2.5.0
// License: MIT or GPLv3
//
// Module: lop@0.4.0
// License: BSD
//
// Module: mammoth@1.4.7
// License: BSD-2-Clause
//
// Module: option@0.2.3
// License: BSD
//
// Module: pako@0.2.9
// License: MIT
//
// Module: path-browserify@0.0.0
// License: MIT
//
// Module: process-nextick-args@1.0.7
// License: MIT
//
// Module: process@0.11.9
// License: MIT
//
// Module: readable-stream@2.2.6
// License: MIT
//
// Module: sax@1.1.6
// License: ISC
//
// Module: stream-browserify@2.0.1
// License: MIT
//
// Module: string_decoder@0.10.31
// License: MIT
//
// Module: underscore@1.4.4
// License: MIT
//
// Module: underscore@1.8.3
// License: MIT
//
// Module: util-deprecate@1.0.2
// License: MIT
//
// Module: util@0.10.3
// License: MIT
//
// Module: xmlbuilder@10.0.0
// License: MIT
//
! function(f) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = f();
    else if ("function" == typeof define && define.amd) define([], f);
    else {
        var g;
        g = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this, g.mammoth = f()
    }
}(function() {
    var define, module, exports;
    return function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = "function" == typeof require && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }
        for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) s(r[o]);
        return s
    }({
        1: [function(require, module, exports) {
            function Files() {
                function read(uri) {
                    return promises.reject(new Error("could not open external image: '" + uri + "'\ncannot open linked files from a web browser"))
                }
                return {
                    read: read
                }
            }
            var promises = require("../../lib/promises");
            exports.Files = Files
        }, {
            "../../lib/promises": 23
        }],
        2: [function(require, module, exports) {
            function openZip(options) {
                return options.arrayBuffer ? promises.resolve(zipfile.openArrayBuffer(options.arrayBuffer)) : promises.reject(new Error("Could not find file in options"))
            }
            var promises = require("../lib/promises"),
                zipfile = require("../lib/zipfile");
            exports.openZip = openZip
        }, {
            "../lib/promises": 23,
            "../lib/zipfile": 38
        }],
        3: [function(require, module, exports) {
            function DocumentConverter(options) {
                return {
                    convertToHtml: function(element) {
                        var comments = _.indexBy(element.type === documents.types.document ? element.comments : [], "commentId"),
                            conversion = new DocumentConversion(options, comments);
                        return conversion.convertToHtml(element)
                    }
                }
            }

            function DocumentConversion(options, comments) {
                function convertToHtml(document) {
                    var messages = [],
                        html = elementToHtml(document, messages, {}),
                        deferredNodes = [];
                    walkHtml(html, function(node) {
                        "deferred" === node.type && deferredNodes.push(node)
                    });
                    var deferredValues = {};
                    return promises.mapSeries(deferredNodes, function(deferred) {
                        return deferred.value().then(function(value) {
                            deferredValues[deferred.id] = value
                        })
                    }).then(function() {
                        function replaceDeferred(nodes) {
                            return flatMap(nodes, function(node) {
                                return "deferred" === node.type ? deferredValues[node.id] : node.children ? [_.extend({}, node, {
                                    children: replaceDeferred(node.children)
                                })] : [node]
                            })
                        }
                        var writer = writers.writer({
                            prettyPrint: options.prettyPrint,
                            outputFormat: options.outputFormat
                        });
                        return Html.write(writer, Html.simplify(replaceDeferred(html))), new results.Result(writer.asString(), messages)
                    })
                }

                function convertElements(elements, messages, options) {
                    return flatMap(elements, function(element) {
                        return elementToHtml(element, messages, options)
                    })
                }

                function elementToHtml(element, messages, options) {
                    if (!options) throw new Error("options not set");
                    var handler = elementConverters[element.type];
                    return handler ? handler(element, messages, options) : []
                }

                function convertParagraph(element, messages, options) {
                    return htmlPathForParagraph(element, messages).wrap(function() {
                        var content = convertElements(element.children, messages, options);
                        return ignoreEmptyParagraphs ? content : [Html.forceWrite].concat(content)
                    })
                }

                function htmlPathForParagraph(element, messages) {
                    var style = findStyle(element);
                    return style ? style.to : (element.styleId && messages.push(unrecognisedStyleWarning("paragraph", element)), defaultParagraphStyle)
                }

                function convertRun(run, messages, options) {
                    var nodes = function() {
                            return convertElements(run.children, messages, options)
                        },
                        paths = [];
                    run.isSmallCaps && paths.push(findHtmlPathForRunProperty("smallCaps")), run.isStrikethrough && paths.push(findHtmlPathForRunProperty("strikethrough", "s")), run.isUnderline && paths.push(findHtmlPathForRunProperty("underline")), run.verticalAlignment === documents.verticalAlignment.subscript && paths.push(htmlPaths.element("sub", {}, {
                        fresh: !1
                    })), run.verticalAlignment === documents.verticalAlignment.superscript && paths.push(htmlPaths.element("sup", {}, {
                        fresh: !1
                    })), run.isItalic && paths.push(findHtmlPathForRunProperty("italic", "em")), run.isBold && paths.push(findHtmlPathForRunProperty("bold", "strong"));
                    var stylePath = htmlPaths.empty,
                        style = findStyle(run);
                    return style ? stylePath = style.to : run.styleId && messages.push(unrecognisedStyleWarning("run", run)), paths.push(stylePath), paths.forEach(function(path) {
                        nodes = path.wrap.bind(path, nodes)
                    }), nodes()
                }

                function findHtmlPathForRunProperty(elementType, defaultTagName) {
                    var path = findHtmlPath({
                        type: elementType
                    });
                    return path ? path : defaultTagName ? htmlPaths.element(defaultTagName, {}, {
                        fresh: !1
                    }) : htmlPaths.empty
                }

                function findHtmlPath(element, defaultPath) {
                    var style = findStyle(element);
                    return style ? style.to : defaultPath
                }

                function findStyle(element) {
                    for (var i = 0; i < styleMap.length; i++)
                        if (styleMap[i].from.matches(element)) return styleMap[i]
                }

                function recoveringConvertImage(convertImage) {
                    return function(image, messages) {
                        return promises.attempt(function() {
                            return convertImage(image, messages)
                        }).caught(function(error) {
                            return messages.push(results.error(error)), []
                        })
                    }
                }

                function noteHtmlId(note) {
                    return referentHtmlId(note.noteType, note.noteId)
                }

                function noteRefHtmlId(note) {
                    return referenceHtmlId(note.noteType, note.noteId)
                }

                function referentHtmlId(referenceType, referenceId) {
                    return htmlId(referenceType + "-" + referenceId)
                }

                function referenceHtmlId(referenceType, referenceId) {
                    return htmlId(referenceType + "-ref-" + referenceId)
                }

                function htmlId(suffix) {
                    return idPrefix + suffix
                }

                function convertTable(element, messages, options) {
                    return findHtmlPath(element, defaultTablePath).wrap(function() {
                        return convertTableChildren(element, messages, options)
                    })
                }

                function convertTableChildren(element, messages, options) {
                    var bodyIndex = _.findIndex(element.children, function(child) {
                        return !child.type === documents.types.tableRow || !child.isHeader
                    }); - 1 === bodyIndex && (bodyIndex = element.children.length);
                    var children;
                    if (0 === bodyIndex) children = convertElements(element.children, messages, _.extend({}, options, {
                        isTableHeader: !1
                    }));
                    else {
                        var headRows = convertElements(element.children.slice(0, bodyIndex), messages, _.extend({}, options, {
                                isTableHeader: !0
                            })),
                            bodyRows = convertElements(element.children.slice(bodyIndex), messages, _.extend({}, options, {
                                isTableHeader: !1
                            }));
                        children = [Html.freshElement("thead", {}, headRows), Html.freshElement("tbody", {}, bodyRows)]
                    }
                    return [Html.forceWrite].concat(children)
                }

                function convertTableRow(element, messages, options) {
                    var children = convertElements(element.children, messages, options);
                    return [Html.freshElement("tr", {}, [Html.forceWrite].concat(children))]
                }

                function convertTableCell(element, messages, options) {
                    var tagName = options.isTableHeader ? "th" : "td",
                        children = convertElements(element.children, messages, options),
                        attributes = {};
                    return 1 !== element.colSpan && (attributes.colspan = element.colSpan.toString()), 1 !== element.rowSpan && (attributes.rowspan = element.rowSpan.toString()), [Html.freshElement(tagName, attributes, [Html.forceWrite].concat(children))]
                }

                function convertCommentReference(reference, messages, options) {
                    return findHtmlPath(reference, htmlPaths.ignore).wrap(function() {
                        var comment = comments[reference.commentId],
                            count = referencedComments.length + 1,
                            label = "[" + commentAuthorLabel(comment) + count + "]";
                        return referencedComments.push({
                            label: label,
                            comment: comment
                        }), [Html.freshElement("a", {
                            href: "#" + referentHtmlId("comment", reference.commentId),
                            id: referenceHtmlId("comment", reference.commentId)
                        }, [Html.text(label)])]
                    })
                }

                function convertComment(referencedComment, messages, options) {
                    var label = referencedComment.label,
                        comment = referencedComment.comment,
                        body = convertElements(comment.body, messages, options).concat([Html.nonFreshElement("p", {}, [Html.text(" "), Html.freshElement("a", {
                            href: "#" + referenceHtmlId("comment", comment.commentId)
                        }, [Html.text("↑")])])]);
                    return [Html.freshElement("dt", {
                        id: referentHtmlId("comment", comment.commentId)
                    }, [Html.text("Comment " + label)]), Html.freshElement("dd", {}, body)]
                }

                function convertBreak(element, messages, options) {
                    return htmlPathForBreak(element).wrap(function() {
                        return []
                    })
                }

                function htmlPathForBreak(element) {
                    var style = findStyle(element);
                    return style ? style.to : "line" === element.breakType ? htmlPaths.topLevelElement("br") : htmlPaths.empty
                }
                var noteNumber = 1,
                    noteReferences = [],
                    referencedComments = [];
                options = _.extend({
                    ignoreEmptyParagraphs: !0
                }, options);
                var idPrefix = void 0 === options.idPrefix ? "" : options.idPrefix,
                    ignoreEmptyParagraphs = options.ignoreEmptyParagraphs,
                    defaultParagraphStyle = htmlPaths.topLevelElement("p"),
                    styleMap = options.styleMap || [],
                    defaultTablePath = htmlPaths.elements([htmlPaths.element("table", {}, {
                        fresh: !0
                    })]),
                    elementConverters = {
                        document: function(document, messages, options) {
                            var children = convertElements(document.children, messages, options),
                                notes = noteReferences.map(function(noteReference) {
                                    return document.notes.resolve(noteReference)
                                }),
                                notesNodes = convertElements(notes, messages, options);
                            return children.concat([Html.freshElement("ol", {}, notesNodes), Html.freshElement("dl", {}, flatMap(referencedComments, function(referencedComment) {
                                return convertComment(referencedComment, messages, options)
                            }))])
                        },
                        paragraph: convertParagraph,
                        run: convertRun,
                        text: function(element, messages, options) {
                            return [Html.text(element.value)]
                        },
                        tab: function(element, messages, options) {
                            return [Html.text("	")]
                        },
                        hyperlink: function(element, messages, options) {
                            var href = element.anchor ? "#" + htmlId(element.anchor) : element.href,
                                attributes = {
                                    href: href
                                };
                            null != element.targetFrame && (attributes.target = element.targetFrame);
                            var children = convertElements(element.children, messages, options);
                            return [Html.freshElement("a", attributes, children)]
                        },
                        bookmarkStart: function(element, messages, options) {
                            var anchor = Html.freshElement("a", {
                                id: htmlId(element.name)
                            }, [Html.forceWrite]);
                            return [anchor]
                        },
                        noteReference: function(element, messages, options) {
                            noteReferences.push(element);
                            var anchor = Html.freshElement("a", {
                                href: "#" + noteHtmlId(element),
                                id: noteRefHtmlId(element)
                            }, [Html.text("[" + noteNumber++ + "]")]);
                            return [Html.freshElement("sup", {}, [anchor])]
                        },
                        note: function(element, messages, options) {
                            var children = convertElements(element.body, messages, options),
                                backLink = Html.elementWithTag(htmlPaths.element("p", {}, {
                                    fresh: !1
                                }), [Html.text(" "), Html.freshElement("a", {
                                    href: "#" + noteRefHtmlId(element)
                                }, [Html.text("↑")])]),
                                body = children.concat([backLink]);
                            return Html.freshElement("li", {
                                id: noteHtmlId(element)
                            }, body)
                        },
                        commentReference: convertCommentReference,
                        comment: convertComment,
                        image: deferredConversion(recoveringConvertImage(options.convertImage || images.dataUri)),
                        table: convertTable,
                        tableRow: convertTableRow,
                        tableCell: convertTableCell,
                        "break": convertBreak
                    };
                return {
                    convertToHtml: convertToHtml
                }
            }

            function deferredConversion(func) {
                return function(element, messages, options) {
                    return [{
                        type: "deferred",
                        id: deferredId++,
                        value: function() {
                            return func(element, messages, options)
                        }
                    }]
                }
            }

            function unrecognisedStyleWarning(type, element) {
                return results.warning("Unrecognised " + type + " style: '" + element.styleName + "' (Style ID: " + element.styleId + ")")
            }

            function flatMap(values, func) {
                return _.flatten(values.map(func), !0)
            }

            function walkHtml(nodes, callback) {
                nodes.forEach(function(node) {
                    callback(node), node.children && walkHtml(node.children, callback)
                })
            }
            var _ = require("underscore"),
                promises = require("./promises"),
                documents = require("./documents"),
                htmlPaths = require("./styles/html-paths"),
                results = require("./results"),
                images = require("./images"),
                Html = require("./html"),
                writers = require("./writers");
            exports.DocumentConverter = DocumentConverter;
            var deferredId = 1,
                commentAuthorLabel = exports.commentAuthorLabel = function(comment) {
                    return comment.authorInitials || ""
                }
        }, {
            "./documents": 4,
            "./html": 18,
            "./images": 20,
            "./promises": 23,
            "./results": 24,
            "./styles/html-paths": 27,
            "./writers": 32,
            underscore: 153
        }],
        4: [function(require, module, exports) {
            function Document(children, options) {
                return options = options || {}, {
                    type: types.document,
                    children: children,
                    notes: options.notes || new Notes({}),
                    comments: options.comments || []
                }
            }

            function Paragraph(children, properties) {
                properties = properties || {};
                var indent = properties.indent || {};
                return {
                    type: types.paragraph,
                    children: children,
                    styleId: properties.styleId || null,
                    styleName: properties.styleName || null,
                    numbering: properties.numbering || null,
                    alignment: properties.alignment || null,
                    indent: {
                        start: indent.start || null,
                        end: indent.end || null,
                        firstLine: indent.firstLine || null,
                        hanging: indent.hanging || null
                    }
                }
            }

            function Run(children, properties) {
                return properties = properties || {}, {
                    type: types.run,
                    children: children,
                    styleId: properties.styleId || null,
                    styleName: properties.styleName || null,
                    isBold: properties.isBold,
                    isUnderline: properties.isUnderline,
                    isItalic: properties.isItalic,
                    isStrikethrough: properties.isStrikethrough,
                    isSmallCaps: properties.isSmallCaps,
                    verticalAlignment: properties.verticalAlignment || verticalAlignment.baseline,
                    font: properties.font || null
                }
            }

            function Text(value) {
                return {
                    type: types.text,
                    value: value
                }
            }

            function Tab() {
                return {
                    type: types.tab
                }
            }

            function Hyperlink(children, options) {
                return {
                    type: types.hyperlink,
                    children: children,
                    href: options.href,
                    anchor: options.anchor,
                    targetFrame: options.targetFrame
                }
            }

            function NoteReference(options) {
                return {
                    type: types.noteReference,
                    noteType: options.noteType,
                    noteId: options.noteId
                }
            }

            function Notes(notes) {
                this._notes = _.indexBy(notes, function(note) {
                    return noteKey(note.noteType, note.noteId)
                })
            }

            function Note(options) {
                return {
                    type: types.note,
                    noteType: options.noteType,
                    noteId: options.noteId,
                    body: options.body
                }
            }

            function commentReference(options) {
                return {
                    type: types.commentReference,
                    commentId: options.commentId
                }
            }

            function comment(options) {
                return {
                    type: types.comment,
                    commentId: options.commentId,
                    body: options.body,
                    authorName: options.authorName,
                    authorInitials: options.authorInitials
                }
            }

            function noteKey(noteType, id) {
                return noteType + "-" + id
            }

            function Image(options) {
                return {
                    type: types.image,
                    read: options.readImage,
                    altText: options.altText,
                    contentType: options.contentType
                }
            }

            function Table(children, properties) {
                return properties = properties || {}, {
                    type: types.table,
                    children: children,
                    styleId: properties.styleId || null,
                    styleName: properties.styleName || null
                }
            }

            function TableRow(children, options) {
                return options = options || {}, {
                    type: types.tableRow,
                    children: children,
                    isHeader: options.isHeader || !1
                }
            }

            function TableCell(children, options) {
                return options = options || {}, {
                    type: types.tableCell,
                    children: children,
                    colSpan: null == options.colSpan ? 1 : options.colSpan,
                    rowSpan: null == options.rowSpan ? 1 : options.rowSpan
                }
            }

            function Break(breakType) {
                return {
                    type: types["break"],
                    breakType: breakType
                }
            }

            function BookmarkStart(options) {
                return {
                    type: types.bookmarkStart,
                    name: options.name
                }
            }
            var _ = require("underscore"),
                types = exports.types = {
                    document: "document",
                    paragraph: "paragraph",
                    run: "run",
                    text: "text",
                    tab: "tab",
                    hyperlink: "hyperlink",
                    noteReference: "noteReference",
                    image: "image",
                    note: "note",
                    commentReference: "commentReference",
                    comment: "comment",
                    table: "table",
                    tableRow: "tableRow",
                    tableCell: "tableCell",
                    "break": "break",
                    bookmarkStart: "bookmarkStart"
                },
                verticalAlignment = {
                    baseline: "baseline",
                    superscript: "superscript",
                    subscript: "subscript"
                };
            Notes.prototype.resolve = function(reference) {
                return this.findNoteByKey(noteKey(reference.noteType, reference.noteId))
            }, Notes.prototype.findNoteByKey = function(key) {
                return this._notes[key] || null
            }, exports.document = exports.Document = Document, exports.paragraph = exports.Paragraph = Paragraph, exports.run = exports.Run = Run, exports.Text = Text, exports.tab = exports.Tab = Tab, exports.Hyperlink = Hyperlink, exports.noteReference = exports.NoteReference = NoteReference, exports.Notes = Notes, exports.Note = Note, exports.commentReference = commentReference, exports.comment = comment, exports.Image = Image, exports.Table = Table, exports.TableRow = TableRow, exports.TableCell = TableCell, exports.lineBreak = Break("line"), exports.pageBreak = Break("page"), exports.columnBreak = Break("column"), exports.BookmarkStart = BookmarkStart, exports.verticalAlignment = verticalAlignment
        }, {
            underscore: 153
        }],
        5: [function(require, module, exports) {
            function createBodyReader(options) {
                return {
                    readXmlElement: function(element) {
                        return new BodyReader(options).readXmlElement(element)
                    },
                    readXmlElements: function(elements) {
                        return new BodyReader(options).readXmlElements(elements)
                    }
                }
            }

            function BodyReader(options) {
                function readXmlElements(elements) {
                    var results = elements.map(readXmlElement);
                    return combineResults(results)
                }

                function readXmlElement(element) {
                    if ("element" === element.type) {
                        var handler = xmlElementReaders[element.name];
                        if (handler) return handler(element);
                        if (!Object.prototype.hasOwnProperty.call(ignoreElements, element.name)) {
                            var message = warning("An unrecognised element was ignored: " + element.name);
                            return emptyResultWithMessages([message])
                        }
                    }
                    return emptyResult()
                }

                function readParagraphIndent(element) {
                    return {
                        start: element.attributes["w:start"] || element.attributes["w:left"],
                        end: element.attributes["w:end"] || element.attributes["w:right"],
                        firstLine: element.attributes["w:firstLine"],
                        hanging: element.attributes["w:hanging"]
                    }
                }

                function readRunProperties(element) {
                    return readRunStyle(element).map(function(style) {
                        return {
                            type: "runProperties",
                            styleId: style.styleId,
                            styleName: style.name,
                            verticalAlignment: element.firstOrEmpty("w:vertAlign").attributes["w:val"],
                            font: element.firstOrEmpty("w:rFonts").attributes["w:ascii"],
                            isBold: readBooleanElement(element.first("w:b")),
                            isUnderline: readBooleanElement(element.first("w:u")),
                            isItalic: readBooleanElement(element.first("w:i")),
                            isStrikethrough: readBooleanElement(element.first("w:strike")),
                            isSmallCaps: readBooleanElement(element.first("w:smallCaps"))
                        }
                    })
                }

                function readBooleanElement(element) {
                    if (element) {
                        var value = element.attributes["w:val"];
                        return "false" !== value && "0" !== value
                    }
                    return !1
                }

                function readParagraphStyle(element) {
                    return readStyle(element, "w:pStyle", "Paragraph", styles.findParagraphStyleById)
                }

                function readRunStyle(element) {
                    return readStyle(element, "w:rStyle", "Run", styles.findCharacterStyleById)
                }

                function readTableStyle(element) {
                    return readStyle(element, "w:tblStyle", "Table", styles.findTableStyleById)
                }

                function readStyle(element, styleTagName, styleType, findStyleById) {
                    var messages = [],
                        styleElement = element.first(styleTagName),
                        styleId = null,
                        name = null;
                    if (styleElement && (styleId = styleElement.attributes["w:val"])) {
                        var style = findStyleById(styleId);
                        style ? name = style.name : messages.push(undefinedStyleWarning(styleType, styleId))
                    }
                    return elementResultWithMessages({
                        styleId: styleId,
                        name: name
                    }, messages)
                }

                function readFldChar(element) {
                    var type = element.attributes["w:fldCharType"];
                    if ("begin" === type) complexFieldStack.push(unknownComplexField), currentInstrText = [];
                    else if ("end" === type) complexFieldStack.pop();
                    else if ("separate" === type) {
                        var href = parseHyperlinkFieldCode(currentInstrText.join("")),
                            complexField = null === href ? unknownComplexField : {
                                type: "hyperlink",
                                href: href
                            };
                        complexFieldStack.pop(), complexFieldStack.push(complexField)
                    }
                    return emptyResult()
                }

                function currentHyperlinkHref() {
                    var topHyperlink = _.last(complexFieldStack.filter(function(complexField) {
                        return "hyperlink" === complexField.type
                    }));
                    return topHyperlink ? topHyperlink.href : null
                }

                function parseHyperlinkFieldCode(code) {
                    var result = /\s*HYPERLINK "(.*)"/.exec(code);
                    return result ? result[1] : null
                }

                function readInstrText(element) {
                    return currentInstrText.push(element.text()), emptyResult()
                }

                function noteReferenceReader(noteType) {
                    return function(element) {
                        var noteId = element.attributes["w:id"];
                        return elementResult(new documents.NoteReference({
                            noteType: noteType,
                            noteId: noteId
                        }))
                    }
                }

                function readCommentReference(element) {
                    return elementResult(documents.commentReference({
                        commentId: element.attributes["w:id"]
                    }))
                }

                function readChildElements(element) {
                    return readXmlElements(element.children)
                }

                function readTable(element) {
                    var propertiesResult = readTableProperties(element.firstOrEmpty("w:tblPr"));
                    return readXmlElements(element.children).flatMap(calculateRowSpans).flatMap(function(children) {
                        return propertiesResult.map(function(properties) {
                            return documents.Table(children, properties)
                        })
                    })
                }

                function readTableProperties(element) {
                    return readTableStyle(element).map(function(style) {
                        return {
                            styleId: style.styleId,
                            styleName: style.name
                        }
                    })
                }

                function readTableRow(element) {
                    var properties = element.firstOrEmpty("w:trPr"),
                        isHeader = !!properties.first("w:tblHeader");
                    return readXmlElements(element.children).map(function(children) {
                        return documents.TableRow(children, {
                            isHeader: isHeader
                        })
                    })
                }

                function readTableCell(element) {
                    return readXmlElements(element.children).map(function(children) {
                        var properties = element.firstOrEmpty("w:tcPr"),
                            gridSpan = properties.firstOrEmpty("w:gridSpan").attributes["w:val"],
                            colSpan = gridSpan ? parseInt(gridSpan, 10) : 1,
                            cell = documents.TableCell(children, {
                                colSpan: colSpan
                            });
                        return cell._vMerge = readVMerge(properties), cell
                    })
                }

                function readVMerge(properties) {
                    var element = properties.first("w:vMerge");
                    if (element) {
                        var val = element.attributes["w:val"];
                        return "continue" === val || !val
                    }
                    return null
                }

                function calculateRowSpans(rows) {
                    var unexpectedNonRows = _.any(rows, function(row) {
                        return row.type !== documents.types.tableRow
                    });
                    if (unexpectedNonRows) return elementResultWithMessages(rows, [warning("unexpected non-row element in table, cell merging may be incorrect")]);
                    var unexpectedNonCells = _.any(rows, function(row) {
                        return _.any(row.children, function(cell) {
                            return cell.type !== documents.types.tableCell
                        })
                    });
                    if (unexpectedNonCells) return elementResultWithMessages(rows, [warning("unexpected non-cell element in table row, cell merging may be incorrect")]);
                    var columns = {};
                    return rows.forEach(function(row) {
                        var cellIndex = 0;
                        row.children.forEach(function(cell) {
                            cell._vMerge && columns[cellIndex] ? columns[cellIndex].rowSpan++ : (columns[cellIndex] = cell, cell._vMerge = !1), cellIndex += cell.colSpan
                        })
                    }), rows.forEach(function(row) {
                        row.children = row.children.filter(function(cell) {
                            return !cell._vMerge
                        }), row.children.forEach(function(cell) {
                            delete cell._vMerge
                        })
                    }), elementResult(rows)
                }

                function readDrawingElement(element) {
                    var blips = element.getElementsByTagName("a:graphic").getElementsByTagName("a:graphicData").getElementsByTagName("pic:pic").getElementsByTagName("pic:blipFill").getElementsByTagName("a:blip");
                    return combineResults(blips.map(readBlip.bind(null, element)))
                }

                function readBlip(element, blip) {
                    var properties = element.first("wp:docPr").attributes,
                        altText = isBlank(properties.descr) ? properties.title : properties.descr;
                    return readImage(findBlipImageFile(blip), altText)
                }

                function isBlank(value) {
                    return null == value || /^\s*$/.test(value)
                }

                function findBlipImageFile(blip) {
                    var embedRelationshipId = blip.attributes["r:embed"],
                        linkRelationshipId = blip.attributes["r:link"];
                    if (embedRelationshipId) return findEmbeddedImageFile(embedRelationshipId);
                    var imagePath = relationships.findTargetByRelationshipId(linkRelationshipId);
                    return {
                        path: imagePath,
                        read: files.read.bind(files, imagePath)
                    }
                }

                function readImageData(element) {
                    var relationshipId = element.attributes["r:id"];
                    return relationshipId ? readImage(findEmbeddedImageFile(relationshipId), element.attributes["o:title"]) : emptyResultWithMessages([warning("A v:imagedata element without a relationship ID was ignored")])
                }

                function findEmbeddedImageFile(relationshipId) {
                    var path = uris.uriToZipEntryName("word", relationships.findTargetByRelationshipId(relationshipId));
                    return {
                        path: path,
                        read: docxFile.read.bind(docxFile, path)
                    }
                }

                function readImage(imageFile, altText) {
                    var contentType = contentTypes.findContentType(imageFile.path),
                        image = documents.Image({
                            readImage: imageFile.read,
                            altText: altText,
                            contentType: contentType
                        }),
                        warnings = supportedImageTypes[contentType] ? [] : warning("Image of type " + contentType + " is unlikely to display in web browsers");
                    return elementResultWithMessages(image, warnings)
                }

                function undefinedStyleWarning(type, styleId) {
                    return warning(type + " style with ID " + styleId + " was referenced but not defined in the document")
                }
                var complexFieldStack = [],
                    currentInstrText = [],
                    relationships = options.relationships,
                    contentTypes = options.contentTypes,
                    docxFile = options.docxFile,
                    files = options.files,
                    numbering = options.numbering,
                    styles = options.styles,
                    unknownComplexField = {
                        type: "unknown"
                    },
                    xmlElementReaders = {
                        "w:p": function(element) {
                            return readXmlElements(element.children).map(function(children) {
                                var properties = _.find(children, isParagraphProperties);
                                return new documents.Paragraph(children.filter(negate(isParagraphProperties)), properties)
                            }).insertExtra()
                        },
                        "w:pPr": function(element) {
                            return readParagraphStyle(element).map(function(style) {
                                return {
                                    type: "paragraphProperties",
                                    styleId: style.styleId,
                                    styleName: style.name,
                                    alignment: element.firstOrEmpty("w:jc").attributes["w:val"],
                                    numbering: readNumberingProperties(element.firstOrEmpty("w:numPr"), numbering),
                                    indent: readParagraphIndent(element.firstOrEmpty("w:ind"))
                                }
                            })
                        },
                        "w:r": function(element) {
                            return readXmlElements(element.children).map(function(children) {
                                var properties = _.find(children, isRunProperties);
                                children = children.filter(negate(isRunProperties));
                                var hyperlinkHref = currentHyperlinkHref();
                                return null !== hyperlinkHref && (children = [new documents.Hyperlink(children, {
                                    href: hyperlinkHref
                                })]), new documents.Run(children, properties)
                            })
                        },
                        "w:rPr": readRunProperties,
                        "w:fldChar": readFldChar,
                        "w:instrText": readInstrText,
                        "w:t": function(element) {
                            return elementResult(new documents.Text(element.text()))
                        },
                        "w:tab": function(element) {
                            return elementResult(new documents.Tab)
                        },
                        "w:noBreakHyphen": function() {
                            return elementResult(new documents.Text("‑"))
                        },
                        "w:hyperlink": function(element) {
                            var relationshipId = element.attributes["r:id"],
                                anchor = element.attributes["w:anchor"];
                            return readXmlElements(element.children).map(function(children) {
                                function create(options) {
                                    var targetFrame = element.attributes["w:tgtFrame"] || null;
                                    return new documents.Hyperlink(children, _.extend({
                                        targetFrame: targetFrame
                                    }, options))
                                }
                                if (relationshipId) {
                                    var href = relationships.findTargetByRelationshipId(relationshipId);
                                    return anchor && (href = uris.replaceFragment(href, anchor)), create({
                                        href: href
                                    })
                                }
                                return anchor ? create({
                                    anchor: anchor
                                }) : children
                            })
                        },
                        "w:tbl": readTable,
                        "w:tr": readTableRow,
                        "w:tc": readTableCell,
                        "w:footnoteReference": noteReferenceReader("footnote"),
                        "w:endnoteReference": noteReferenceReader("endnote"),
                        "w:commentReference": readCommentReference,
                        "w:br": function(element) {
                            var breakType = element.attributes["w:type"];
                            return null == breakType || "textWrapping" === breakType ? elementResult(documents.lineBreak) : "page" === breakType ? elementResult(documents.pageBreak) : "column" === breakType ? elementResult(documents.columnBreak) : emptyResultWithMessages([warning("Unsupported break type: " + breakType)])
                        },
                        "w:bookmarkStart": function(element) {
                            var name = element.attributes["w:name"];
                            return "_GoBack" === name ? emptyResult() : elementResult(new documents.BookmarkStart({
                                name: name
                            }))
                        },
                        "mc:AlternateContent": function(element) {
                            return readChildElements(element.first("mc:Fallback"))
                        },
                        "w:sdt": function(element) {
                            return readXmlElements(element.firstOrEmpty("w:sdtContent").children)
                        },
                        "w:ins": readChildElements,
                        "w:object": readChildElements,
                        "w:smartTag": readChildElements,
                        "w:drawing": readChildElements,
                        "w:pict": function(element) {
                            return readChildElements(element).toExtra()
                        },
                        "v:roundrect": readChildElements,
                        "v:shape": readChildElements,
                        "v:textbox": readChildElements,
                        "w:txbxContent": readChildElements,
                        "wp:inline": readDrawingElement,
                        "wp:anchor": readDrawingElement,
                        "v:imagedata": readImageData,
                        "v:group": readChildElements,
                        "v:rect": readChildElements
                    };
                return {
                    readXmlElement: readXmlElement,
                    readXmlElements: readXmlElements
                }
            }

            function readNumberingProperties(element, numbering) {
                var level = element.firstOrEmpty("w:ilvl").attributes["w:val"],
                    numId = element.firstOrEmpty("w:numId").attributes["w:val"];
                return void 0 === level || void 0 === numId ? null : numbering.findLevel(numId, level)
            }

            function isParagraphProperties(element) {
                return "paragraphProperties" === element.type
            }

            function isRunProperties(element) {
                return "runProperties" === element.type
            }

            function negate(predicate) {
                return function(value) {
                    return !predicate(value)
                }
            }

            function emptyResultWithMessages(messages) {
                return new ReadResult(null, null, messages)
            }

            function emptyResult() {
                return new ReadResult(null)
            }

            function elementResult(element) {
                return new ReadResult(element)
            }

            function elementResultWithMessages(element, messages) {
                return new ReadResult(element, null, messages)
            }

            function ReadResult(element, extra, messages) {
                this.value = element || [], this.extra = extra, this._result = new Result({
                    element: this.value,
                    extra: extra
                }, messages), this.messages = this._result.messages
            }

            function combineResults(results) {
                var result = Result.combine(_.pluck(results, "_result"));
                return new ReadResult(_.flatten(_.pluck(result.value, "element")), _.filter(_.flatten(_.pluck(result.value, "extra")), identity), result.messages)
            }

            function joinElements(first, second) {
                return _.flatten([first, second])
            }

            function identity(value) {
                return value
            }
            exports.createBodyReader = createBodyReader, exports._readNumberingProperties = readNumberingProperties;
            var _ = require("underscore"),
                documents = require("../documents"),
                Result = require("../results").Result,
                warning = require("../results").warning,
                uris = require("./uris"),
                supportedImageTypes = {
                    "image/png": !0,
                    "image/gif": !0,
                    "image/jpeg": !0,
                    "image/svg+xml": !0,
                    "image/tiff": !0
                },
                ignoreElements = {
                    "office-word:wrap": !0,
                    "v:shadow": !0,
                    "v:shapetype": !0,
                    "w:annotationRef": !0,
                    "w:bookmarkEnd": !0,
                    "w:sectPr": !0,
                    "w:proofErr": !0,
                    "w:lastRenderedPageBreak": !0,
                    "w:commentRangeStart": !0,
                    "w:commentRangeEnd": !0,
                    "w:del": !0,
                    "w:footnoteRef": !0,
                    "w:endnoteRef": !0,
                    "w:tblPr": !0,
                    "w:tblGrid": !0,
                    "w:trPr": !0,
                    "w:tcPr": !0
                };
            ReadResult.prototype.toExtra = function() {
                return new ReadResult(null, joinElements(this.extra, this.value), this.messages)
            }, ReadResult.prototype.insertExtra = function() {
                var extra = this.extra;
                return extra && extra.length ? new ReadResult(joinElements(this.value, extra), null, this.messages) : this
            }, ReadResult.prototype.map = function(func) {
                var result = this._result.map(function(value) {
                    return func(value.element)
                });
                return new ReadResult(result.value, this.extra, result.messages)
            }, ReadResult.prototype.flatMap = function(func) {
                var result = this._result.flatMap(function(value) {
                    return func(value.element)._result
                });
                return new ReadResult(result.value.element, joinElements(this.extra, result.value.extra), result.messages)
            }
        }, {
            "../documents": 4,
            "../results": 24,
            "./uris": 16,
            underscore: 153
        }],
        6: [function(require, module, exports) {
            function createCommentsReader(bodyReader) {
                function readCommentsXml(element) {
                    return Result.combine(element.getElementsByTagName("w:comment").map(readCommentElement))
                }

                function readCommentElement(element) {
                    function readOptionalAttribute(name) {
                        return (element.attributes[name] || "").trim() || null
                    }
                    var id = element.attributes["w:id"];
                    return bodyReader.readXmlElements(element.children).map(function(body) {
                        return documents.comment({
                            commentId: id,
                            body: body,
                            authorName: readOptionalAttribute("w:author"),
                            authorInitials: readOptionalAttribute("w:initials")
                        })
                    })
                }
                return readCommentsXml
            }
            var documents = require("../documents"),
                Result = require("../results").Result;
            exports.createCommentsReader = createCommentsReader
        }, {
            "../documents": 4,
            "../results": 24
        }],
        7: [function(require, module, exports) {
            function readContentTypesFromXml(element) {
                var extensionDefaults = {},
                    overrides = {};
                return element.children.forEach(function(child) {
                    if ("content-types:Default" === child.name && (extensionDefaults[child.attributes.Extension] = child.attributes.ContentType), "content-types:Override" === child.name) {
                        var name = child.attributes.PartName;
                        "/" === name.charAt(0) && (name = name.substring(1)), overrides[name] = child.attributes.ContentType
                    }
                }), contentTypes(overrides, extensionDefaults)
            }

            function contentTypes(overrides, extensionDefaults) {
                return {
                    findContentType: function(path) {
                        var overrideContentType = overrides[path];
                        if (overrideContentType) return overrideContentType;
                        var pathParts = path.split("."),
                            extension = pathParts[pathParts.length - 1];
                        if (extensionDefaults.hasOwnProperty(extension)) return extensionDefaults[extension];
                        var fallback = fallbackContentTypes[extension.toLowerCase()];
                        return fallback ? "image/" + fallback : null
                    }
                }
            }
            exports.readContentTypesFromXml = readContentTypesFromXml;
            var fallbackContentTypes = {
                png: "png",
                gif: "gif",
                jpeg: "jpeg",
                jpg: "jpeg",
                tif: "tiff",
                tiff: "tiff",
                bmp: "bmp"
            };
            exports.defaultContentTypes = contentTypes({}, {})
        }, {}],
        8: [function(require, module, exports) {
            function DocumentXmlReader(options) {
                function convertXmlToDocument(element) {
                    var body = element.first("w:body"),
                        result = bodyReader.readXmlElements(body.children).map(function(children) {
                            return new documents.Document(children, {
                                notes: options.notes,
                                comments: options.comments
                            })
                        });
                    return new Result(result.value, result.messages)
                }
                var bodyReader = options.bodyReader;
                return {
                    convertXmlToDocument: convertXmlToDocument
                }
            }
            exports.DocumentXmlReader = DocumentXmlReader;
            var documents = require("../documents"),
                Result = require("../results").Result
        }, {
            "../documents": 4,
            "../results": 24
        }],
        9: [function(require, module, exports) {
            function read(docxFile, input) {
                return input = input || {},
                    promises.props({
                        contentTypes: readContentTypesFromZipFile(docxFile),
                        partPaths: findPartPaths(docxFile),
                        docxFile: docxFile,
                        files: new Files(input.path ? path.dirname(input.path) : null)
                    }).also(function(result) {
                        return {
                            styles: readStylesFromZipFile(docxFile, result.partPaths.styles)
                        }
                    }).also(function(result) {
                        return {
                            numbering: readNumberingFromZipFile(docxFile, result.partPaths.numbering, result.styles)
                        }
                    }).also(function(result) {
                        return {
                            footnotes: readXmlFileWithBody(result.partPaths.footnotes, result, function(bodyReader, xml) {
                                return xml ? notesReader.createFootnotesReader(bodyReader)(xml) : new Result([])
                            }),
                            endnotes: readXmlFileWithBody(result.partPaths.endnotes, result, function(bodyReader, xml) {
                                return xml ? notesReader.createEndnotesReader(bodyReader)(xml) : new Result([])
                            }),
                            comments: readXmlFileWithBody(result.partPaths.comments, result, function(bodyReader, xml) {
                                return xml ? commentsReader.createCommentsReader(bodyReader)(xml) : new Result([])
                            })
                        }
                    }).also(function(result) {
                        return {
                            notes: result.footnotes.flatMap(function(footnotes) {
                                return result.endnotes.map(function(endnotes) {
                                    return new documents.Notes(footnotes.concat(endnotes))
                                })
                            })
                        }
                    }).then(function(result) {
                        return readXmlFileWithBody(result.partPaths.mainDocument, result, function(bodyReader, xml) {
                            return result.notes.flatMap(function(notes) {
                                return result.comments.flatMap(function(comments) {
                                    var reader = new DocumentXmlReader({
                                        bodyReader: bodyReader,
                                        notes: notes,
                                        comments: comments
                                    });
                                    return reader.convertXmlToDocument(xml)
                                })
                            })
                        })
                    })
            }

            function findPartPaths(docxFile) {
                return readPackageRelationships(docxFile).then(function(packageRelationships) {
                    var mainDocumentPath = findPartPath({
                        docxFile: docxFile,
                        relationships: packageRelationships,
                        relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
                        basePath: "",
                        fallbackPath: "word/document.xml"
                    });
                    if (!docxFile.exists(mainDocumentPath)) throw new Error("Could not find main document part. Are you sure this is a valid .docx file?");
                    return xmlFileReader({
                        filename: relationshipsFilename(mainDocumentPath),
                        readElement: relationshipsReader.readRelationships,
                        defaultValue: relationshipsReader.defaultValue
                    })(docxFile).then(function(documentRelationships) {
                        function findPartRelatedToMainDocument(name) {
                            return findPartPath({
                                docxFile: docxFile,
                                relationships: documentRelationships,
                                relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/" + name,
                                basePath: zipfile.splitPath(mainDocumentPath).dirname,
                                fallbackPath: "word/" + name + ".xml"
                            })
                        }
                        return {
                            mainDocument: mainDocumentPath,
                            comments: findPartRelatedToMainDocument("comments"),
                            endnotes: findPartRelatedToMainDocument("endnotes"),
                            footnotes: findPartRelatedToMainDocument("footnotes"),
                            numbering: findPartRelatedToMainDocument("numbering"),
                            styles: findPartRelatedToMainDocument("styles")
                        }
                    })
                })
            }

            function findPartPath(options) {
                var docxFile = options.docxFile,
                    relationships = options.relationships,
                    relationshipType = options.relationshipType,
                    basePath = options.basePath,
                    fallbackPath = options.fallbackPath,
                    targets = relationships.findTargetsByType(relationshipType),
                    normalisedTargets = targets.map(function(target) {
                        return stripPrefix(zipfile.joinPath(basePath, target), "/")
                    }),
                    validTargets = normalisedTargets.filter(function(target) {
                        return docxFile.exists(target)
                    });
                return 0 === validTargets.length ? fallbackPath : validTargets[0]
            }

            function stripPrefix(value, prefix) {
                return value.substring(0, prefix.length) === prefix ? value.substring(prefix.length) : value
            }

            function xmlFileReader(options) {
                return function(zipFile) {
                    return readXmlFromZipFile(zipFile, options.filename).then(function(element) {
                        return element ? options.readElement(element) : options.defaultValue
                    })
                }
            }

            function readXmlFileWithBody(filename, options, func) {
                var readRelationshipsFromZipFile = xmlFileReader({
                    filename: relationshipsFilename(filename),
                    readElement: relationshipsReader.readRelationships,
                    defaultValue: relationshipsReader.defaultValue
                });
                return readRelationshipsFromZipFile(options.docxFile).then(function(relationships) {
                    var bodyReader = new createBodyReader({
                        relationships: relationships,
                        contentTypes: options.contentTypes,
                        docxFile: options.docxFile,
                        numbering: options.numbering,
                        styles: options.styles,
                        files: options.files
                    });
                    return readXmlFromZipFile(options.docxFile, filename).then(function(xml) {
                        return func(bodyReader, xml)
                    })
                })
            }

            function relationshipsFilename(filename) {
                var split = zipfile.splitPath(filename);
                return zipfile.joinPath(split.dirname, "_rels", split.basename + ".rels")
            }

            function readNumberingFromZipFile(zipFile, path, styles) {
                return xmlFileReader({
                    filename: path,
                    readElement: function(element) {
                        return numberingXml.readNumberingXml(element, {
                            styles: styles
                        })
                    },
                    defaultValue: numberingXml.defaultNumbering
                })(zipFile)
            }

            function readStylesFromZipFile(zipFile, path) {
                return xmlFileReader({
                    filename: path,
                    readElement: stylesReader.readStylesXml,
                    defaultValue: stylesReader.defaultStyles
                })(zipFile)
            }
            exports.read = read, exports._findPartPaths = findPartPaths;
            var path = require("path"),
                promises = require("../promises"),
                documents = require("../documents"),
                Result = require("../results").Result,
                zipfile = require("../zipfile"),
                readXmlFromZipFile = require("./office-xml-reader").readXmlFromZipFile,
                createBodyReader = require("./body-reader").createBodyReader,
                DocumentXmlReader = require("./document-xml-reader").DocumentXmlReader,
                relationshipsReader = require("./relationships-reader"),
                contentTypesReader = require("./content-types-reader"),
                numberingXml = require("./numbering-xml"),
                stylesReader = require("./styles-reader"),
                notesReader = require("./notes-reader"),
                commentsReader = require("./comments-reader"),
                Files = require("./files").Files,
                readContentTypesFromZipFile = xmlFileReader({
                    filename: "[Content_Types].xml",
                    readElement: contentTypesReader.readContentTypesFromXml,
                    defaultValue: contentTypesReader.defaultContentTypes
                }),
                readPackageRelationships = xmlFileReader({
                    filename: "_rels/.rels",
                    readElement: relationshipsReader.readRelationships,
                    defaultValue: relationshipsReader.defaultValue
                })
        }, {
            "../documents": 4,
            "../promises": 23,
            "../results": 24,
            "../zipfile": 38,
            "./body-reader": 5,
            "./comments-reader": 6,
            "./content-types-reader": 7,
            "./document-xml-reader": 8,
            "./files": 1,
            "./notes-reader": 10,
            "./numbering-xml": 11,
            "./office-xml-reader": 12,
            "./relationships-reader": 13,
            "./styles-reader": 15,
            path: 136
        }],
        10: [function(require, module, exports) {
            function createReader(noteType, bodyReader) {
                function readNotesXml(element) {
                    return Result.combine(element.getElementsByTagName("w:" + noteType).filter(isFootnoteElement).map(readFootnoteElement))
                }

                function isFootnoteElement(element) {
                    var type = element.attributes["w:type"];
                    return "continuationSeparator" !== type && "separator" !== type
                }

                function readFootnoteElement(footnoteElement) {
                    var id = footnoteElement.attributes["w:id"];
                    return bodyReader.readXmlElements(footnoteElement.children).map(function(body) {
                        return documents.Note({
                            noteType: noteType,
                            noteId: id,
                            body: body
                        })
                    })
                }
                return readNotesXml
            }
            var documents = require("../documents"),
                Result = require("../results").Result;
            exports.createFootnotesReader = createReader.bind(this, "footnote"), exports.createEndnotesReader = createReader.bind(this, "endnote")
        }, {
            "../documents": 4,
            "../results": 24
        }],
        11: [function(require, module, exports) {
            function Numbering(nums, abstractNums, styles) {
                function findLevel(numId, level) {
                    var num = nums[numId];
                    if (num) {
                        var abstractNum = abstractNums[num.abstractNumId];
                        if (null == abstractNum.numStyleLink) return abstractNums[num.abstractNumId].levels[level];
                        var style = styles.findNumberingStyleById(abstractNum.numStyleLink);
                        return findLevel(style.numId, level)
                    }
                    return null
                }
                return {
                    findLevel: findLevel
                }
            }

            function readNumberingXml(root, options) {
                if (!options || !options.styles) throw new Error("styles is missing");
                var abstractNums = readAbstractNums(root),
                    nums = readNums(root, abstractNums);
                return new Numbering(nums, abstractNums, options.styles)
            }

            function readAbstractNums(root) {
                var abstractNums = {};
                return root.getElementsByTagName("w:abstractNum").forEach(function(element) {
                    var id = element.attributes["w:abstractNumId"];
                    abstractNums[id] = readAbstractNum(element)
                }), abstractNums
            }

            function readAbstractNum(element) {
                var levels = {};
                element.getElementsByTagName("w:lvl").forEach(function(levelElement) {
                    var levelIndex = levelElement.attributes["w:ilvl"],
                        numFmt = levelElement.first("w:numFmt").attributes["w:val"];
                    levels[levelIndex] = {
                        isOrdered: "bullet" !== numFmt,
                        level: levelIndex
                    }
                });
                var numStyleLink = element.firstOrEmpty("w:numStyleLink").attributes["w:val"];
                return {
                    levels: levels,
                    numStyleLink: numStyleLink
                }
            }

            function readNums(root) {
                var nums = {};
                return root.getElementsByTagName("w:num").forEach(function(element) {
                    var numId = element.attributes["w:numId"],
                        abstractNumId = element.first("w:abstractNumId").attributes["w:val"];
                    nums[numId] = {
                        abstractNumId: abstractNumId
                    }
                }), nums
            }
            exports.readNumberingXml = readNumberingXml, exports.Numbering = Numbering, exports.defaultNumbering = new Numbering({})
        }, {}],
        12: [function(require, module, exports) {
            function read(xmlString) {
                return xml.readString(xmlString, xmlNamespaceMap).then(function(document) {
                    return collapseAlternateContent(document)[0]
                })
            }

            function readXmlFromZipFile(docxFile, path) {
                return docxFile.exists(path) ? docxFile.read(path, "utf-8").then(stripUtf8Bom).then(read) : promises.resolve(null)
            }

            function stripUtf8Bom(xmlString) {
                return xmlString.replace(/^\uFEFF/g, "")
            }

            function collapseAlternateContent(node) {
                return "element" === node.type ? "mc:AlternateContent" === node.name ? node.first("mc:Fallback").children : (node.children = _.flatten(node.children.map(collapseAlternateContent, !0)), [node]) : [node]
            }
            var _ = require("underscore"),
                promises = require("../promises"),
                xml = require("../xml");
            exports.read = read, exports.readXmlFromZipFile = readXmlFromZipFile;
            var xmlNamespaceMap = {
                "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r",
                "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp",
                "http://schemas.openxmlformats.org/drawingml/2006/main": "a",
                "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic",
                "http://schemas.openxmlformats.org/package/2006/content-types": "content-types",
                "urn:schemas-microsoft-com:vml": "v",
                "http://schemas.openxmlformats.org/markup-compatibility/2006": "mc",
                "urn:schemas-microsoft-com:office:word": "office-word"
            }
        }, {
            "../promises": 23,
            "../xml": 34,
            underscore: 153
        }],
        13: [function(require, module, exports) {
            function readRelationships(element) {
                var relationships = [];
                return element.children.forEach(function(child) {
                    if ("{http://schemas.openxmlformats.org/package/2006/relationships}Relationship" === child.name) {
                        var relationship = {
                            relationshipId: child.attributes.Id,
                            target: child.attributes.Target,
                            type: child.attributes.Type
                        };
                        relationships.push(relationship)
                    }
                }), new Relationships(relationships)
            }

            function Relationships(relationships) {
                var targetsByRelationshipId = {};
                relationships.forEach(function(relationship) {
                    targetsByRelationshipId[relationship.relationshipId] = relationship.target
                });
                var targetsByType = {};
                return relationships.forEach(function(relationship) {
                    targetsByType[relationship.type] || (targetsByType[relationship.type] = []), targetsByType[relationship.type].push(relationship.target)
                }), {
                    findTargetByRelationshipId: function(relationshipId) {
                        return targetsByRelationshipId[relationshipId]
                    },
                    findTargetsByType: function(type) {
                        return targetsByType[type] || []
                    }
                }
            }
            exports.readRelationships = readRelationships, exports.defaultValue = new Relationships([]), exports.Relationships = Relationships
        }, {}],
        14: [function(require, module, exports) {
            function writeStyleMap(docxFile, styleMap) {
                return docxFile.write(styleMapPath, styleMap), updateRelationships(docxFile).then(function() {
                    return updateContentTypes(docxFile)
                })
            }

            function updateRelationships(docxFile) {
                var path = "word/_rels/document.xml.rels",
                    relationshipsUri = "http://schemas.openxmlformats.org/package/2006/relationships",
                    relationshipElementName = "{" + relationshipsUri + "}Relationship";
                return docxFile.read(path, "utf8").then(xml.readString).then(function(relationshipsContainer) {
                    var relationships = relationshipsContainer.children;
                    addOrUpdateElement(relationships, relationshipElementName, "Id", {
                        Id: "rMammothStyleMap",
                        Type: schema,
                        Target: styleMapAbsolutePath
                    });
                    var namespaces = {
                        "": relationshipsUri
                    };
                    return docxFile.write(path, xml.writeString(relationshipsContainer, namespaces))
                })
            }

            function updateContentTypes(docxFile) {
                var path = "[Content_Types].xml",
                    contentTypesUri = "http://schemas.openxmlformats.org/package/2006/content-types",
                    overrideName = "{" + contentTypesUri + "}Override";
                return docxFile.read(path, "utf8").then(xml.readString).then(function(typesElement) {
                    var children = typesElement.children;
                    addOrUpdateElement(children, overrideName, "PartName", {
                        PartName: styleMapAbsolutePath,
                        ContentType: "text/prs.mammoth.style-map"
                    });
                    var namespaces = {
                        "": contentTypesUri
                    };
                    return docxFile.write(path, xml.writeString(typesElement, namespaces))
                })
            }

            function addOrUpdateElement(elements, name, identifyingAttribute, attributes) {
                var existingElement = _.find(elements, function(element) {
                    return element.name === name && element.attributes[identifyingAttribute] === attributes[identifyingAttribute]
                });
                existingElement ? existingElement.attributes = attributes : elements.push(xml.element(name, attributes))
            }

            function readStyleMap(docxFile) {
                return docxFile.exists(styleMapPath) ? docxFile.read(styleMapPath, "utf8") : promises.resolve(null)
            }
            var _ = require("underscore"),
                promises = require("../promises"),
                xml = require("../xml");
            exports.writeStyleMap = writeStyleMap, exports.readStyleMap = readStyleMap;
            var schema = "http://schemas.zwobble.org/mammoth/style-map",
                styleMapPath = "mammoth/style-map",
                styleMapAbsolutePath = "/" + styleMapPath
        }, {
            "../promises": 23,
            "../xml": 34,
            underscore: 153
        }],
        15: [function(require, module, exports) {
            function Styles(paragraphStyles, characterStyles, tableStyles, numberingStyles) {
                return {
                    findParagraphStyleById: function(styleId) {
                        return paragraphStyles[styleId]
                    },
                    findCharacterStyleById: function(styleId) {
                        return characterStyles[styleId]
                    },
                    findTableStyleById: function(styleId) {
                        return tableStyles[styleId]
                    },
                    findNumberingStyleById: function(styleId) {
                        return numberingStyles[styleId]
                    }
                }
            }

            function readStylesXml(root) {
                var paragraphStyles = {},
                    characterStyles = {},
                    tableStyles = {},
                    numberingStyles = {},
                    styles = {
                        paragraph: paragraphStyles,
                        character: characterStyles,
                        table: tableStyles
                    };
                return root.getElementsByTagName("w:style").forEach(function(styleElement) {
                    var style = readStyleElement(styleElement);
                    if ("numbering" === style.type) numberingStyles[style.styleId] = readNumberingStyleElement(styleElement);
                    else {
                        var styleSet = styles[style.type];
                        styleSet && (styleSet[style.styleId] = style)
                    }
                }), new Styles(paragraphStyles, characterStyles, tableStyles, numberingStyles)
            }

            function readStyleElement(styleElement) {
                var type = styleElement.attributes["w:type"],
                    styleId = styleElement.attributes["w:styleId"],
                    name = styleName(styleElement);
                return {
                    type: type,
                    styleId: styleId,
                    name: name
                }
            }

            function styleName(styleElement) {
                var nameElement = styleElement.first("w:name");
                return nameElement ? nameElement.attributes["w:val"] : null
            }

            function readNumberingStyleElement(styleElement) {
                var numId = styleElement.firstOrEmpty("w:pPr").firstOrEmpty("w:numPr").firstOrEmpty("w:numId").attributes["w:val"];
                return {
                    numId: numId
                }
            }
            exports.readStylesXml = readStylesXml, exports.Styles = Styles, exports.defaultStyles = new Styles({}, {}), Styles.EMPTY = new Styles({}, {}, {}, {})
        }, {}],
        16: [function(require, module, exports) {
            function uriToZipEntryName(base, uri) {
                return "/" === uri.charAt(0) ? uri.substr(1) : base + "/" + uri
            }

            function replaceFragment(uri, fragment) {
                var hashIndex = uri.indexOf("#");
                return -1 !== hashIndex && (uri = uri.substring(0, hashIndex)), uri + "#" + fragment
            }
            exports.uriToZipEntryName = uriToZipEntryName, exports.replaceFragment = replaceFragment
        }, {}],
        17: [function(require, module, exports) {
            function nonFreshElement(tagName, attributes, children) {
                return elementWithTag(htmlPaths.element(tagName, attributes, {
                    fresh: !1
                }), children)
            }

            function freshElement(tagName, attributes, children) {
                var tag = htmlPaths.element(tagName, attributes, {
                    fresh: !0
                });
                return elementWithTag(tag, children)
            }

            function elementWithTag(tag, children) {
                return {
                    type: "element",
                    tag: tag,
                    children: children || []
                }
            }

            function text(value) {
                return {
                    type: "text",
                    value: value
                }
            }

            function isVoidElement(node) {
                return 0 === node.children.length && voidTagNames[node.tag.tagName]
            }
            var htmlPaths = require("../styles/html-paths"),
                forceWrite = {
                    type: "forceWrite"
                };
            exports.freshElement = freshElement, exports.nonFreshElement = nonFreshElement, exports.elementWithTag = elementWithTag, exports.text = text, exports.forceWrite = forceWrite;
            var voidTagNames = {
                br: !0,
                hr: !0,
                img: !0
            };
            exports.isVoidElement = isVoidElement
        }, {
            "../styles/html-paths": 27
        }],
        18: [function(require, module, exports) {
            function write(writer, nodes) {
                nodes.forEach(function(node) {
                    writeNode(writer, node)
                })
            }

            function writeNode(writer, node) {
                toStrings[node.type](writer, node)
            }

            function generateElementString(writer, node) {
                ast.isVoidElement(node) ? writer.selfClosing(node.tag.tagName, node.tag.attributes) : (writer.open(node.tag.tagName, node.tag.attributes), write(writer, node.children), writer.close(node.tag.tagName))
            }

            function generateTextString(writer, node) {
                writer.text(node.value)
            }
            var ast = require("./ast");
            exports.freshElement = ast.freshElement, exports.nonFreshElement = ast.nonFreshElement, exports.elementWithTag = ast.elementWithTag, exports.text = ast.text, exports.forceWrite = ast.forceWrite, exports.simplify = require("./simplify");
            var toStrings = {
                element: generateElementString,
                text: generateTextString,
                forceWrite: function() {}
            };
            exports.write = write
        }, {
            "./ast": 17,
            "./simplify": 19
        }],
        19: [function(require, module, exports) {
            function simplify(nodes) {
                return collapse(removeEmpty(nodes))
            }

            function collapse(nodes) {
                var children = [];
                return nodes.map(collapseNode).forEach(function(child) {
                    appendChild(children, child)
                }), children
            }

            function collapseNode(node) {
                return collapsers[node.type](node)
            }

            function collapseElement(node) {
                return ast.elementWithTag(node.tag, collapse(node.children))
            }

            function identity(value) {
                return value
            }

            function appendChild(children, child) {
                var lastChild = children[children.length - 1];
                "element" === child.type && !child.tag.fresh && lastChild && "element" === lastChild.type && child.tag.matchesElement(lastChild.tag) ? (child.tag.separator && appendChild(lastChild.children, ast.text(child.tag.separator)), child.children.forEach(function(grandChild) {
                    appendChild(lastChild.children, grandChild)
                })) : children.push(child)
            }

            function removeEmpty(nodes) {
                return flatMap(nodes, function(node) {
                    return emptiers[node.type](node)
                })
            }

            function flatMap(values, func) {
                return _.flatten(_.map(values, func), !0)
            }

            function neverEmpty(node) {
                return [node]
            }

            function elementEmptier(element) {
                var children = removeEmpty(element.children);
                return 0 !== children.length || ast.isVoidElement(element) ? [ast.elementWithTag(element.tag, children)] : []
            }

            function textEmptier(node) {
                return 0 === node.value.length ? [] : [node]
            }
            var _ = require("underscore"),
                ast = require("./ast"),
                collapsers = {
                    element: collapseElement,
                    text: identity,
                    forceWrite: identity
                },
                emptiers = {
                    element: elementEmptier,
                    text: textEmptier,
                    forceWrite: neverEmpty
                };
            module.exports = simplify
        }, {
            "./ast": 17,
            underscore: 153
        }],
        20: [function(require, module, exports) {
            function imgElement(func) {
                return function(element, messages) {
                    return promises.when(func(element)).then(function(result) {
                        var attributes = _.clone(result);
                        return element.altText && (attributes.alt = element.altText), [Html.freshElement("img", attributes)]
                    })
                }
            }
            var _ = require("underscore"),
                promises = require("./promises"),
                Html = require("./html");
            exports.imgElement = imgElement, exports.inline = exports.imgElement, exports.dataUri = imgElement(function(element) {
                return element.read("base64").then(function(imageBuffer) {
                    return {
                        src: "data:" + element.contentType + ";base64," + imageBuffer
                    }
                })
            })
        }, {
            "./html": 18,
            "./promises": 23,
            underscore: 153
        }],
        21: [function(require, module, exports) {
            function convertToHtml(input, options) {
                return convert(input, options)
            }

            function convertToMarkdown(input, options) {
                var markdownOptions = Object.create(options || {});
                return markdownOptions.outputFormat = "markdown", convert(input, markdownOptions)
            }

            function convert(input, options) {
                return options = readOptions(options), unzip.openZip(input).tap(function(docxFile) {
                    return docxStyleMap.readStyleMap(docxFile).then(function(styleMap) {
                        options.embeddedStyleMap = styleMap
                    })
                }).then(function(docxFile) {
                    return docxReader.read(docxFile, input).then(function(documentResult) {
                        return documentResult.map(options.transformDocument)
                    }).then(function(documentResult) {
                        return convertDocumentToHtml(documentResult, options)
                    })
                })
            }

            function readEmbeddedStyleMap(input) {
                return unzip.openZip(input).then(docxStyleMap.readStyleMap)
            }

            function convertDocumentToHtml(documentResult, options) {
                var styleMapResult = parseStyleMap(options.readStyleMap()),
                    parsedOptions = _.extend({}, options, {
                        styleMap: styleMapResult.value
                    }),
                    documentConverter = new DocumentConverter(parsedOptions);
                return documentResult.flatMapThen(function(document) {
                    return styleMapResult.flatMapThen(function(styleMap) {
                        return documentConverter.convertToHtml(document)
                    })
                })
            }

            function parseStyleMap(styleMap) {
                return Result.combine((styleMap || []).map(readStyle)).map(function(styleMap) {
                    return styleMap.filter(function(styleMapping) {
                        return !!styleMapping
                    })
                })
            }

            function extractRawText(input) {
                return unzip.openZip(input).then(docxReader.read).then(function(documentResult) {
                    return documentResult.map(convertElementToRawText)
                })
            }

            function convertElementToRawText(element) {
                if ("text" === element.type) return element.value;
                var tail = "paragraph" === element.type ? "\n\n" : "";
                return (element.children || []).map(convertElementToRawText).join("") + tail
            }

            function embedStyleMap(input, styleMap) {
                return unzip.openZip(input).tap(function(docxFile) {
                    return docxStyleMap.writeStyleMap(docxFile, styleMap)
                }).then(function(docxFile) {
                    return {
                        toBuffer: docxFile.toBuffer
                    }
                })
            }
            var _ = require("underscore"),
                docxReader = require("./docx/docx-reader"),
                docxStyleMap = require("./docx/style-map"),
                DocumentConverter = require("./document-to-html").DocumentConverter,
                readStyle = require("./style-reader").readStyle,
                readOptions = require("./options-reader").readOptions,
                unzip = require("./unzip"),
                Result = require("./results").Result;
            exports.convertToHtml = convertToHtml, exports.convertToMarkdown = convertToMarkdown, exports.convert = convert, exports.extractRawText = extractRawText, exports.images = require("./images"), exports.transforms = require("./transforms"), exports.underline = require("./underline"), exports.embedStyleMap = embedStyleMap, exports.readEmbeddedStyleMap = readEmbeddedStyleMap, exports.styleMapping = function() {
                throw new Error("Use a raw string instead of mammoth.styleMapping e.g. \"p[style-name='Title'] => h1\" instead of mammoth.styleMapping(\"p[style-name='Title'] => h1\")")
            }
        }, {
            "./document-to-html": 3,
            "./docx/docx-reader": 9,
            "./docx/style-map": 14,
            "./images": 20,
            "./options-reader": 22,
            "./results": 24,
            "./style-reader": 25,
            "./transforms": 29,
            "./underline": 30,
            "./unzip": 2,
            underscore: 153
        }],
        22: [function(require, module, exports) {
            function readOptions(options) {
                return options = options || {}, _.extend({}, standardOptions, options, {
                    customStyleMap: readStyleMap(options.styleMap),
                    readStyleMap: function() {
                        var styleMap = this.customStyleMap;
                        return this.includeEmbeddedStyleMap && (styleMap = styleMap.concat(readStyleMap(this.embeddedStyleMap))), this.includeDefaultStyleMap && (styleMap = styleMap.concat(defaultStyleMap)), styleMap
                    }
                })
            }

            function readStyleMap(styleMap) {
                return styleMap ? _.isString(styleMap) ? styleMap.split("\n").map(function(line) {
                    return line.trim()
                }).filter(function(line) {
                    return "" !== line && "#" !== line.charAt(0)
                }) : styleMap : []
            }

            function identity(value) {
                return value
            }
            exports.readOptions = readOptions;
            var _ = require("underscore"),
                defaultStyleMap = exports._defaultStyleMap = ["p.Heading1 => h1:fresh", "p.Heading2 => h2:fresh", "p.Heading3 => h3:fresh", "p.Heading4 => h4:fresh", "p.Heading5 => h5:fresh", "p.Heading6 => h6:fresh", "p[style-name='Heading 1'] => h1:fresh", "p[style-name='Heading 2'] => h2:fresh", "p[style-name='Heading 3'] => h3:fresh", "p[style-name='Heading 4'] => h4:fresh", "p[style-name='Heading 5'] => h5:fresh", "p[style-name='Heading 6'] => h6:fresh", "p[style-name='heading 1'] => h1:fresh", "p[style-name='heading 2'] => h2:fresh", "p[style-name='heading 3'] => h3:fresh", "p[style-name='heading 4'] => h4:fresh", "p[style-name='heading 5'] => h5:fresh", "p[style-name='heading 6'] => h6:fresh", "r[style-name='Strong'] => strong", "p[style-name='footnote text'] => p:fresh", "r[style-name='footnote reference'] =>", "p[style-name='endnote text'] => p:fresh", "r[style-name='endnote reference'] =>", "p[style-name='annotation text'] => p:fresh", "r[style-name='annotation reference'] =>", "p[style-name='Footnote'] => p:fresh", "r[style-name='Footnote anchor'] =>", "p[style-name='Endnote'] => p:fresh", "r[style-name='Endnote anchor'] =>", "p:unordered-list(1) => ul > li:fresh", "p:unordered-list(2) => ul|ol > li > ul > li:fresh", "p:unordered-list(3) => ul|ol > li > ul|ol > li > ul > li:fresh", "p:unordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh", "p:unordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh", "p:ordered-list(1) => ol > li:fresh", "p:ordered-list(2) => ul|ol > li > ol > li:fresh", "p:ordered-list(3) => ul|ol > li > ul|ol > li > ol > li:fresh", "p:ordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh", "p:ordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh", "r[style-name='Hyperlink'] =>", "p[style-name='Normal'] => p:fresh"],
                standardOptions = exports._standardOptions = {
                    transformDocument: identity,
                    includeDefaultStyleMap: !0,
                    includeEmbeddedStyleMap: !0
                }
        }, {
            underscore: 153
        }],
        23: [function(require, module, exports) {
            function defer() {
                var resolve, reject, promise = new bluebird.Promise(function(resolveArg, rejectArg) {
                    resolve = resolveArg, reject = rejectArg
                });
                return {
                    resolve: resolve,
                    reject: reject,
                    promise: promise
                }
            }
            var _ = require("underscore"),
                bluebird = require("bluebird/js/release/promise")();
            exports.defer = defer, exports.when = bluebird.resolve, exports.resolve = bluebird.resolve, exports.all = bluebird.all, exports.props = bluebird.props, exports.reject = bluebird.reject, exports.promisify = bluebird.promisify, exports.mapSeries = bluebird.mapSeries, exports.attempt = bluebird.attempt, exports.nfcall = function(func) {
                var args = Array.prototype.slice.call(arguments, 1),
                    promisedFunc = bluebird.promisify(func);
                return promisedFunc.apply(null, args)
            }, bluebird.prototype.fail = bluebird.prototype.caught, bluebird.prototype.also = function(func) {
                return this.then(function(value) {
                    var returnValue = _.extend({}, value, func(value));
                    return bluebird.props(returnValue)
                })
            }
        }, {
            "bluebird/js/release/promise": 60,
            underscore: 153
        }],
        24: [function(require, module, exports) {
            function Result(value, messages) {
                this.value = value, this.messages = messages || []
            }

            function success(value) {
                return new Result(value, [])
            }

            function warning(message) {
                return {
                    type: "warning",
                    message: message
                }
            }

            function error(exception) {
                return {
                    type: "error",
                    message: exception.message,
                    error: exception
                }
            }

            function combineMessages(results) {
                var messages = [];
                return _.flatten(_.pluck(results, "messages"), !0).forEach(function(message) {
                    containsMessage(messages, message) || messages.push(message)
                }), messages
            }

            function containsMessage(messages, message) {
                return void 0 !== _.find(messages, isSameMessage.bind(null, message))
            }

            function isSameMessage(first, second) {
                return first.type === second.type && first.message === second.message
            }
            var _ = require("underscore");
            exports.Result = Result, exports.success = success, exports.warning = warning, exports.error = error, Result.prototype.map = function(func) {
                return new Result(func(this.value), this.messages)
            }, Result.prototype.flatMap = function(func) {
                var funcResult = func(this.value);
                return new Result(funcResult.value, combineMessages([this, funcResult]))
            }, Result.prototype.flatMapThen = function(func) {
                var that = this;
                return func(this.value).then(function(otherResult) {
                    return new Result(otherResult.value, combineMessages([that, otherResult]))
                })
            }, Result.combine = function(results) {
                var values = _.flatten(_.pluck(results, "value")),
                    messages = combineMessages(results);
                return new Result(values, messages)
            }
        }, {
            underscore: 153
        }],
        25: [function(require, module, exports) {
            function readStyle(string) {
                return parseString(styleRule, string)
            }

            function createStyleRule() {
                return lop.rules.sequence(lop.rules.sequence.capture(documentMatcherRule()), lop.rules.tokenOfType("whitespace"), lop.rules.tokenOfType("arrow"), lop.rules.sequence.capture(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("whitespace"), lop.rules.sequence.capture(htmlPathRule())).head())), lop.rules.tokenOfType("end")).map(function(documentMatcher, htmlPath) {
                    return {
                        from: documentMatcher,
                        to: htmlPath.valueOrElse(htmlPaths.empty)
                    }
                })
            }

            function readDocumentMatcher(string) {
                return parseString(documentMatcherRule(), string)
            }

            function documentMatcherRule() {
                function createMatcherSuffixesRule(rules) {
                    var matcherSuffix = lop.rules.firstOf.apply(lop.rules.firstOf, ["matcher suffix"].concat(rules)),
                        matcherSuffixes = lop.rules.zeroOrMore(matcherSuffix);
                    return lop.rules.then(matcherSuffixes, function(suffixes) {
                        var matcherOptions = {};
                        return suffixes.forEach(function(suffix) {
                            _.extend(matcherOptions, suffix)
                        }), matcherOptions
                    })
                }
                var sequence = lop.rules.sequence,
                    identifierToConstant = function(identifier, constant) {
                        return lop.rules.then(lop.rules.token("identifier", identifier), function() {
                            return constant
                        })
                    },
                    paragraphRule = identifierToConstant("p", documentMatchers.paragraph),
                    runRule = identifierToConstant("r", documentMatchers.run),
                    elementTypeRule = lop.rules.firstOf("p or r or table", paragraphRule, runRule),
                    styleIdRule = lop.rules.then(classRule, function(styleId) {
                        return {
                            styleId: styleId
                        }
                    }),
                    styleNameMatcherRule = lop.rules.firstOf("style name matcher", lop.rules.then(lop.rules.sequence(lop.rules.tokenOfType("equals"), lop.rules.sequence.cut(), lop.rules.sequence.capture(stringRule)).head(), function(styleName) {
                        return {
                            styleName: documentMatchers.equalTo(styleName)
                        }
                    }), lop.rules.then(lop.rules.sequence(lop.rules.tokenOfType("startsWith"), lop.rules.sequence.cut(), lop.rules.sequence.capture(stringRule)).head(), function(styleName) {
                        return {
                            styleName: documentMatchers.startsWith(styleName)
                        }
                    })),
                    styleNameRule = lop.rules.sequence(lop.rules.tokenOfType("open-square-bracket"), lop.rules.sequence.cut(), lop.rules.token("identifier", "style-name"), lop.rules.sequence.capture(styleNameMatcherRule), lop.rules.tokenOfType("close-square-bracket")).head(),
                    listTypeRule = lop.rules.firstOf("list type", identifierToConstant("ordered-list", {
                        isOrdered: !0
                    }), identifierToConstant("unordered-list", {
                        isOrdered: !1
                    })),
                    listRule = sequence(lop.rules.tokenOfType("colon"), sequence.capture(listTypeRule), sequence.cut(), lop.rules.tokenOfType("open-paren"), sequence.capture(integerRule), lop.rules.tokenOfType("close-paren")).map(function(listType, levelNumber) {
                        return {
                            list: {
                                isOrdered: listType.isOrdered,
                                levelIndex: levelNumber - 1
                            }
                        }
                    }),
                    paragraphOrRun = sequence(sequence.capture(elementTypeRule), sequence.capture(createMatcherSuffixesRule([styleIdRule, styleNameRule, listRule]))).map(function(createMatcher, matcherOptions) {
                        return createMatcher(matcherOptions)
                    }),
                    table = sequence(lop.rules.token("identifier", "table"), sequence.capture(createMatcherSuffixesRule([styleIdRule, styleNameRule]))).map(function(options) {
                        return documentMatchers.table(options)
                    }),
                    bold = identifierToConstant("b", documentMatchers.bold),
                    italic = identifierToConstant("i", documentMatchers.italic),
                    underline = identifierToConstant("u", documentMatchers.underline),
                    strikethrough = identifierToConstant("strike", documentMatchers.strikethrough),
                    smallCaps = identifierToConstant("small-caps", documentMatchers.smallCaps),
                    commentReference = identifierToConstant("comment-reference", documentMatchers.commentReference),
                    breakMatcher = sequence(lop.rules.token("identifier", "br"), sequence.cut(), lop.rules.tokenOfType("open-square-bracket"), lop.rules.token("identifier", "type"), lop.rules.tokenOfType("equals"), sequence.capture(stringRule), lop.rules.tokenOfType("close-square-bracket")).map(function(breakType) {
                        switch (breakType) {
                            case "line":
                                return documentMatchers.lineBreak;
                            case "page":
                                return documentMatchers.pageBreak;
                            case "column":
                                return documentMatchers.columnBreak
                        }
                    });
                return lop.rules.firstOf("element type", paragraphOrRun, table, bold, italic, underline, strikethrough, smallCaps, commentReference, breakMatcher)
            }

            function readHtmlPath(string) {
                return parseString(htmlPathRule(), string)
            }

            function htmlPathRule() {
                var capture = lop.rules.sequence.capture,
                    whitespaceRule = lop.rules.tokenOfType("whitespace"),
                    freshRule = lop.rules.then(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("colon"), lop.rules.token("identifier", "fresh"))), function(option) {
                        return option.map(function() {
                            return !0
                        }).valueOrElse(!1)
                    }),
                    separatorRule = lop.rules.then(lop.rules.optional(lop.rules.sequence(lop.rules.tokenOfType("colon"), lop.rules.token("identifier", "separator"), lop.rules.tokenOfType("open-paren"), capture(stringRule), lop.rules.tokenOfType("close-paren")).head()), function(option) {
                        return option.valueOrElse("")
                    }),
                    tagNamesRule = lop.rules.oneOrMoreWithSeparator(identifierRule, lop.rules.tokenOfType("choice")),
                    styleElementRule = lop.rules.sequence(capture(tagNamesRule), capture(lop.rules.zeroOrMore(classRule)), capture(freshRule), capture(separatorRule)).map(function(tagName, classNames, fresh, separator) {
                        var attributes = {},
                            options = {};
                        return classNames.length > 0 && (attributes["class"] = classNames.join(" ")), fresh && (options.fresh = !0), separator && (options.separator = separator), htmlPaths.element(tagName, attributes, options)
                    });
                return lop.rules.firstOf("html path", lop.rules.then(lop.rules.tokenOfType("bang"), function() {
                    return htmlPaths.ignore
                }), lop.rules.then(lop.rules.zeroOrMoreWithSeparator(styleElementRule, lop.rules.sequence(whitespaceRule, lop.rules.tokenOfType("gt"), whitespaceRule)), htmlPaths.elements))
            }

            function decodeEscapeSequences(value) {
                return value.replace(/\\(.)/g, function(match, code) {
                    return escapeSequences[code] || code
                })
            }

            function parseString(rule, string) {
                var tokens = tokenise(string),
                    parser = lop.Parser(),
                    parseResult = parser.parseTokens(rule, tokens);
                return parseResult.isSuccess() ? results.success(parseResult.value()) : new results.Result(null, [results.warning(describeFailure(string, parseResult))])
            }

            function describeFailure(input, parseResult) {
                return "Did not understand this style mapping, so ignored it: " + input + "\n" + parseResult.errors().map(describeError).join("\n")
            }

            function describeError(error) {
                return "Error was at character number " + error.characterNumber() + ": Expected " + error.expected + " but got " + error.actual
            }
            var _ = require("underscore"),
                lop = require("lop"),
                documentMatchers = require("./styles/document-matchers"),
                htmlPaths = require("./styles/html-paths"),
                tokenise = require("./styles/parser/tokeniser").tokenise,
                results = require("./results");
            exports.readHtmlPath = readHtmlPath, exports.readDocumentMatcher = readDocumentMatcher, exports.readStyle = readStyle;
            var identifierRule = lop.rules.then(lop.rules.tokenOfType("identifier"), decodeEscapeSequences),
                integerRule = lop.rules.tokenOfType("integer"),
                stringRule = lop.rules.then(lop.rules.tokenOfType("string"), decodeEscapeSequences),
                escapeSequences = {
                    n: "\n",
                    r: "\r",
                    t: "	"
                },
                classRule = lop.rules.sequence(lop.rules.tokenOfType("dot"), lop.rules.sequence.cut(), lop.rules.sequence.capture(identifierRule)).head(),
                styleRule = createStyleRule()
        }, {
            "./results": 24,
            "./styles/document-matchers": 26,
            "./styles/html-paths": 27,
            "./styles/parser/tokeniser": 28,
            lop: 107,
            underscore: 153
        }],
        26: [function(require, module, exports) {
            function paragraph(options) {
                return new Matcher("paragraph", options)
            }

            function run(options) {
                return new Matcher("run", options)
            }

            function table(options) {
                return new Matcher("table", options)
            }

            function Matcher(elementType, options) {
                options = options || {}, this._elementType = elementType, this._styleId = options.styleId, this._styleName = options.styleName, options.list && (this._listIndex = options.list.levelIndex, this._listIsOrdered = options.list.isOrdered)
            }

            function isList(element, levelIndex, isOrdered) {
                return element.numbering && element.numbering.level == levelIndex && element.numbering.isOrdered == isOrdered
            }

            function equalTo(value) {
                return {
                    operator: operatorEqualTo,
                    operand: value
                }
            }

            function startsWith(value) {
                return {
                    operator: operatorStartsWith,
                    operand: value
                }
            }

            function operatorEqualTo(first, second) {
                return first.toUpperCase() === second.toUpperCase()
            }

            function operatorStartsWith(first, second) {
                return 0 === second.toUpperCase().indexOf(first.toUpperCase())
            }
            exports.paragraph = paragraph, exports.run = run, exports.table = table, exports.bold = new Matcher("bold"), exports.italic = new Matcher("italic"), exports.underline = new Matcher("underline"), exports.strikethrough = new Matcher("strikethrough"), exports.smallCaps = new Matcher("smallCaps"), exports.commentReference = new Matcher("commentReference"), exports.lineBreak = new Matcher("break", {
                breakType: "line"
            }), exports.pageBreak = new Matcher("break", {
                breakType: "page"
            }), exports.columnBreak = new Matcher("break", {
                breakType: "column"
            }), exports.equalTo = equalTo, exports.startsWith = startsWith, Matcher.prototype.matches = function(element) {
                return element.type === this._elementType && (void 0 === this._styleId || element.styleId === this._styleId) && (void 0 === this._styleName || element.styleName && this._styleName.operator(this._styleName.operand, element.styleName)) && (void 0 === this._listIndex || isList(element, this._listIndex, this._listIsOrdered)) && (void 0 === this._breakType || this._breakType === element.breakType)
            }
        }, {}],
        27: [function(require, module, exports) {
            function topLevelElement(tagName, attributes) {
                return elements([element(tagName, attributes, {
                    fresh: !0
                })])
            }

            function elements(elementStyles) {
                return new HtmlPath(elementStyles.map(function(elementStyle) {
                    return _.isString(elementStyle) ? element(elementStyle) : elementStyle
                }))
            }

            function HtmlPath(elements) {
                this._elements = elements
            }

            function element(tagName, attributes, options) {
                return options = options || {}, new Element(tagName, attributes, options)
            }

            function Element(tagName, attributes, options) {
                var tagNames = {};
                _.isArray(tagName) ? (tagName.forEach(function(tagName) {
                    tagNames[tagName] = !0
                }), tagName = tagName[0]) : tagNames[tagName] = !0, this.tagName = tagName, this.tagNames = tagNames, this.attributes = attributes || {}, this.fresh = options.fresh, this.separator = options.separator
            }
            var _ = require("underscore"),
                html = require("../html");
            exports.topLevelElement = topLevelElement, exports.elements = elements, exports.element = element, HtmlPath.prototype.wrap = function(children) {
                for (var result = children(), index = this._elements.length - 1; index >= 0; index--) result = this._elements[index].wrapNodes(result);
                return result
            }, Element.prototype.matchesElement = function(element) {
                return this.tagNames[element.tagName] && _.isEqual(this.attributes || {}, element.attributes || {})
            }, Element.prototype.wrap = function(generateNodes) {
                return this.wrapNodes(generateNodes())
            }, Element.prototype.wrapNodes = function(nodes) {
                return [html.elementWithTag(this, nodes)]
            }, exports.empty = elements([]), exports.ignore = {
                wrap: function() {
                    return []
                }
            }
        }, {
            "../html": 18,
            underscore: 153
        }],
        28: [function(require, module, exports) {
            function tokenise(string) {
                var identifierCharacter = "(?:[a-zA-Z\\-_]|\\\\.)",
                    tokeniser = new RegexTokeniser([{
                        name: "identifier",
                        regex: new RegExp("(" + identifierCharacter + "(?:" + identifierCharacter + "|[0-9])*)")
                    }, {
                        name: "dot",
                        regex: /\./
                    }, {
                        name: "colon",
                        regex: /:/
                    }, {
                        name: "gt",
                        regex: />/
                    }, {
                        name: "whitespace",
                        regex: /\s+/
                    }, {
                        name: "arrow",
                        regex: /=>/
                    }, {
                        name: "equals",
                        regex: /=/
                    }, {
                        name: "startsWith",
                        regex: /\^=/
                    }, {
                        name: "open-paren",
                        regex: /\(/
                    }, {
                        name: "close-paren",
                        regex: /\)/
                    }, {
                        name: "open-square-bracket",
                        regex: /\[/
                    }, {
                        name: "close-square-bracket",
                        regex: /\]/
                    }, {
                        name: "string",
                        regex: new RegExp(stringPrefix + "'")
                    }, {
                        name: "unterminated-string",
                        regex: new RegExp(stringPrefix)
                    }, {
                        name: "integer",
                        regex: /([0-9]+)/
                    }, {
                        name: "choice",
                        regex: /\|/
                    }, {
                        name: "bang",
                        regex: /(!)/
                    }]);
                return tokeniser.tokenise(string)
            }
            var lop = require("lop"),
                RegexTokeniser = lop.RegexTokeniser;
            exports.tokenise = tokenise;
            var stringPrefix = "'((?:\\\\.|[^'])*)"
        }, {
            lop: 107
        }],
        29: [function(require, module, exports) {
            function paragraph(transform) {
                return elementsOfType("paragraph", transform)
            }

            function run(transform) {
                return elementsOfType("run", transform)
            }

            function elementsOfType(elementType, transform) {
                return elements(function(element) {
                    return element.type === elementType ? transform(element) : element
                })
            }

            function elements(transform) {
                return function transformElement(element) {
                    if (element.children) {
                        var children = _.map(element.children, transformElement);
                        element = _.extend(element, {
                            children: children
                        })
                    }
                    return transform(element)
                }
            }

            function getDescendantsOfType(element, type) {
                return getDescendants(element).filter(function(descendant) {
                    return descendant.type === type
                })
            }

            function getDescendants(element) {
                var descendants = [];
                return visitDescendants(element, function(descendant) {
                    descendants.push(descendant)
                }), descendants
            }

            function visitDescendants(element, visit) {
                element.children && element.children.forEach(function(child) {
                    visitDescendants(child, visit), visit(child)
                })
            }
            var _ = require("underscore");
            exports.paragraph = paragraph, exports.run = run, exports._elements = elements, exports.getDescendantsOfType = getDescendantsOfType, exports.getDescendants = getDescendants
        }, {
            underscore: 153
        }],
        30: [function(require, module, exports) {
            function element(name) {
                return function(html) {
                    return Html.elementWithTag(htmlPaths.element(name), [html])
                }
            }
            var htmlPaths = require("./styles/html-paths"),
                Html = require("./html");
            exports.element = element
        }, {
            "./html": 18,
            "./styles/html-paths": 27
        }],
        31: [function(require, module, exports) {
            function writer(options) {
                return options = options || {}, options.prettyPrint ? prettyWriter() : simpleWriter()
            }

            function prettyWriter() {
                function open(tagName, attributes) {
                    indentedElements[tagName] && indent(), stack.push(tagName), writer.open(tagName, attributes), indentedElements[tagName] && indentationLevel++, start = !1
                }

                function close(tagName) {
                    indentedElements[tagName] && (indentationLevel--, indent()), stack.pop(), writer.close(tagName)
                }

                function text(value) {
                    startText();
                    var text = isInPre() ? value : value.replace("\n", "\n" + indentation);
                    writer.text(text)
                }

                function selfClosing(tagName, attributes) {
                    indent(), writer.selfClosing(tagName, attributes)
                }

                function insideIndentedElement() {
                    return 0 === stack.length || indentedElements[stack[stack.length - 1]]
                }

                function startText() {
                    inText || (indent(), inText = !0)
                }

                function indent() {
                    if (inText = !1, !start && insideIndentedElement() && !isInPre()) {
                        writer._append("\n");
                        for (var i = 0; indentationLevel > i; i++) writer._append(indentation)
                    }
                }

                function isInPre() {
                    return _.some(stack, function(tagName) {
                        return "pre" === tagName
                    })
                }
                var indentationLevel = 0,
                    indentation = "  ",
                    stack = [],
                    start = !0,
                    inText = !1,
                    writer = simpleWriter();
                return {
                    asString: writer.asString,
                    open: open,
                    close: close,
                    text: text,
                    selfClosing: selfClosing
                }
            }

            function simpleWriter() {
                function open(tagName, attributes) {
                    var attributeString = generateAttributeString(attributes);
                    fragments.push(util.format("<%s%s>", tagName, attributeString))
                }

                function close(tagName) {
                    fragments.push(util.format("</%s>", tagName))
                }

                function selfClosing(tagName, attributes) {
                    var attributeString = generateAttributeString(attributes);
                    fragments.push(util.format("<%s%s />", tagName, attributeString))
                }

                function generateAttributeString(attributes) {
                    return _.map(attributes, function(value, key) {
                        return util.format(' %s="%s"', key, escapeHtmlAttribute(value))
                    }).join("")
                }

                function text(value) {
                    fragments.push(escapeHtmlText(value))
                }

                function append(html) {
                    fragments.push(html)
                }

                function asString() {
                    return fragments.join("")
                }
                var fragments = [];
                return {
                    asString: asString,
                    open: open,
                    close: close,
                    text: text,
                    selfClosing: selfClosing,
                    _append: append
                }
            }

            function escapeHtmlText(value) {
                return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            }

            function escapeHtmlAttribute(value) {
                return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            }
            var util = require("util"),
                _ = require("underscore");
            exports.writer = writer;
            var indentedElements = {
                div: !0,
                p: !0,
                ul: !0,
                li: !0
            }
        }, {
            underscore: 153,
            util: 157
        }],
        32: [function(require, module, exports) {
            function writer(options) {
                return options = options || {}, "markdown" === options.outputFormat ? markdownWriter.writer() : htmlWriter.writer(options)
            }
            var htmlWriter = require("./html-writer"),
                markdownWriter = require("./markdown-writer");
            exports.writer = writer
        }, {
            "./html-writer": 31,
            "./markdown-writer": 33
        }],
        33: [function(require, module, exports) {
            function symmetricMarkdownElement(end) {
                return markdownElement(end, end)
            }

            function markdownElement(start, end) {
                return function() {
                    return {
                        start: start,
                        end: end
                    }
                }
            }

            function markdownLink(attributes) {
                var href = attributes.href || "";
                return href ? {
                    start: "[",
                    end: "](" + href + ")",
                    anchorPosition: "before"
                } : {}
            }

            function markdownImage(attributes) {
                var src = attributes.src || "",
                    altText = attributes.alt || "";
                return src || altText ? {
                    start: "![" + altText + "](" + src + ")"
                } : {}
            }

            function markdownList(options) {
                return function(attributes, list) {
                    return {
                        start: list ? "\n" : "",
                        end: list ? "" : "\n",
                        list: {
                            isOrdered: options.isOrdered,
                            indent: list ? list.indent + 1 : 0,
                            count: 0
                        }
                    }
                }
            }

            function markdownListItem(attributes, list, listItem) {
                list = list || {
                    indent: 0,
                    isOrdered: !1,
                    count: 0
                }, list.count++, listItem.hasClosed = !1;
                var bullet = list.isOrdered ? list.count + "." : "-",
                    start = repeatString("	", list.indent) + bullet + " ";
                return {
                    start: start,
                    end: function() {
                        return listItem.hasClosed ? void 0 : (listItem.hasClosed = !0, "\n")
                    }
                }
            }

            function repeatString(value, count) {
                return new Array(count + 1).join(value)
            }

            function markdownWriter() {
                function open(tagName, attributes) {
                    attributes = attributes || {};
                    var createElement = htmlToMarkdown[tagName] || function() {
                            return {}
                        },
                        element = createElement(attributes, list, listItem);
                    elementStack.push({
                        end: element.end,
                        list: list
                    }), element.list && (list = element.list);
                    var anchorBeforeStart = "before" === element.anchorPosition;
                    anchorBeforeStart && writeAnchor(attributes), fragments.push(element.start || ""), anchorBeforeStart || writeAnchor(attributes)
                }

                function writeAnchor(attributes) {
                    attributes.id && fragments.push('<a id="' + attributes.id + '"></a>')
                }

                function close(tagName) {
                    var element = elementStack.pop();
                    list = element.list;
                    var end = _.isFunction(element.end) ? element.end() : element.end;
                    fragments.push(end || "")
                }

                function selfClosing(tagName, attributes) {
                    open(tagName, attributes), close(tagName)
                }

                function text(value) {
                    fragments.push(escapeMarkdown(value))
                }

                function asString() {
                    return fragments.join("")
                }
                var fragments = [],
                    elementStack = [],
                    list = null,
                    listItem = {};
                return {
                    asString: asString,
                    open: open,
                    close: close,
                    text: text,
                    selfClosing: selfClosing
                }
            }

            function escapeMarkdown(value) {
                return value.replace(/\\/g, "\\\\").replace(/([\`\*_\{\}\[\]\(\)\#\+\-\.\!])/g, "\\$1")
            }
            var _ = require("underscore"),
                htmlToMarkdown = {
                    p: markdownElement("", "\n\n"),
                    br: markdownElement("", "  \n"),
                    ul: markdownList({
                        isOrdered: !1
                    }),
                    ol: markdownList({
                        isOrdered: !0
                    }),
                    li: markdownListItem,
                    strong: symmetricMarkdownElement("__"),
                    em: symmetricMarkdownElement("*"),
                    a: markdownLink,
                    img: markdownImage
                };
            ! function() {
                for (var i = 1; 6 >= i; i++) htmlToMarkdown["h" + i] = markdownElement(repeatString("#", i) + " ", "\n\n")
            }(), exports.writer = markdownWriter
        }, {
            underscore: 153
        }],
        34: [function(require, module, exports) {
            var nodes = require("./nodes");
            exports.Element = nodes.Element, exports.element = nodes.element, exports.text = nodes.text, exports.readString = require("./reader").readString, exports.writeString = require("./writer").writeString
        }, {
            "./nodes": 35,
            "./reader": 36,
            "./writer": 37
        }],
        35: [function(require, module, exports) {
            function Element(name, attributes, children) {
                this.type = "element", this.name = name, this.attributes = attributes || {}, this.children = children || []
            }

            function toElementList(array) {
                return _.extend(array, elementListPrototype)
            }
            var _ = require("underscore");
            exports.Element = Element, exports.element = function(name, attributes, children) {
                return new Element(name, attributes, children)
            }, exports.text = function(value) {
                return {
                    type: "text",
                    value: value
                }
            };
            var emptyElement = {
                first: function() {
                    return null
                },
                firstOrEmpty: function() {
                    return emptyElement
                },
                attributes: {}
            };
            Element.prototype.first = function(name) {
                return _.find(this.children, function(child) {
                    return child.name === name
                })
            }, Element.prototype.firstOrEmpty = function(name) {
                return this.first(name) || emptyElement
            }, Element.prototype.getElementsByTagName = function(name) {
                var elements = _.filter(this.children, function(child) {
                    return child.name === name
                });
                return toElementList(elements)
            }, Element.prototype.text = function() {
                if (0 === this.children.length) return "";
                if (1 !== this.children.length || "text" !== this.children[0].type) throw new Error("Not implemented");
                return this.children[0].value
            };
            var elementListPrototype = {
                getElementsByTagName: function(name) {
                    return toElementList(_.flatten(this.map(function(element) {
                        return element.getElementsByTagName(name)
                    }, !0)))
                }
            }
        }, {
            underscore: 153
        }],
        36: [function(require, module, exports) {
            function readString(xmlString, namespaceMap) {
                function mapName(node) {
                    if (node.uri) {
                        var prefix, mappedPrefix = namespaceMap[node.uri];
                        return prefix = mappedPrefix ? mappedPrefix + ":" : "{" + node.uri + "}", prefix + node.local
                    }
                    return node.local
                }
                namespaceMap = namespaceMap || {};
                var finished = !1,
                    parser = sax.parser(!0, {
                        xmlns: !0,
                        position: !1
                    }),
                    rootElement = {
                        children: []
                    },
                    currentElement = rootElement,
                    stack = [],
                    deferred = promises.defer();
                return parser.onopentag = function(node) {
                    var attributes = mapObject(node.attributes, function(attribute) {
                            return attribute.value
                        }, mapName),
                        element = new Element(mapName(node), attributes);
                    currentElement.children.push(element), stack.push(currentElement), currentElement = element
                }, parser.onclosetag = function(node) {
                    currentElement = stack.pop()
                }, parser.ontext = function(text) {
                    currentElement !== rootElement && currentElement.children.push(nodes.text(text))
                }, parser.onend = function() {
                    finished || (finished = !0, deferred.resolve(rootElement.children[0]))
                }, parser.onerror = function(error) {
                    finished || (finished = !0, deferred.reject(error))
                }, parser.write(xmlString).close(), deferred.promise
            }

            function mapObject(input, valueFunc, keyFunc) {
                return _.reduce(input, function(result, value, key) {
                    var mappedKey = keyFunc(value, key, input);
                    return result[mappedKey] = valueFunc(value, key, input), result
                }, {})
            }
            var promises = require("../promises"),
                sax = require("sax"),
                _ = require("underscore"),
                nodes = require("./nodes"),
                Element = nodes.Element;
            exports.readString = readString
        }, {
            "../promises": 23,
            "./nodes": 35,
            sax: 150,
            underscore: 153
        }],
        37: [function(require, module, exports) {
            function writeString(root, namespaces) {
                function writeNode(builder, node) {
                    return nodeWriters[node.type](builder, node)
                }

                function writeElement(builder, element) {
                    var elementBuilder = builder.element(mapElementName(element.name), element.attributes);
                    element.children.forEach(function(child) {
                        writeNode(elementBuilder, child)
                    })
                }

                function mapElementName(name) {
                    var longFormMatch = /^\{(.*)\}(.*)$/.exec(name);
                    if (longFormMatch) {
                        var prefix = uriToPrefix[longFormMatch[1]];
                        return prefix + ("" === prefix ? "" : ":") + longFormMatch[2]
                    }
                    return name
                }

                function writeDocument(root) {
                    var builder = xmlbuilder.create(mapElementName(root.name), {
                        version: "1.0",
                        encoding: "UTF-8",
                        standalone: !0
                    });
                    return _.forEach(namespaces, function(uri, prefix) {
                        var key = "xmlns" + ("" === prefix ? "" : ":" + prefix);
                        builder.attribute(key, uri)
                    }), root.children.forEach(function(child) {
                        writeNode(builder, child)
                    }), builder.end()
                }
                var uriToPrefix = _.invert(namespaces),
                    nodeWriters = {
                        element: writeElement,
                        text: writeTextNode
                    };
                return writeDocument(root)
            }

            function writeTextNode(builder, node) {
                builder.text(node.value)
            }
            var _ = require("underscore"),
                xmlbuilder = require("xmlbuilder");
            exports.writeString = writeString
        }, {
            underscore: 153,
            xmlbuilder: 179
        }],
        38: [function(require, module, exports) {
            (function(Buffer) {
                function openArrayBuffer(arrayBuffer) {
                    function exists(name) {
                        return null !== zipFile.file(name)
                    }

                    function read(name, encoding) {
                        var array = zipFile.file(name).asUint8Array(),
                            buffer = new Buffer(array);
                        return encoding ? promises.when(buffer.toString(encoding)) : promises.when(buffer)
                    }

                    function write(name, contents) {
                        zipFile.file(name, contents)
                    }

                    function toBuffer() {
                        return zipFile.generate({
                            type: "nodebuffer"
                        })
                    }
                    var zipFile = new JSZip(arrayBuffer);
                    return {
                        exists: exists,
                        read: read,
                        write: write,
                        toBuffer: toBuffer
                    }
                }

                function splitPath(path) {
                    var lastIndex = path.lastIndexOf("/");
                    return -1 === lastIndex ? {
                        dirname: "",
                        basename: path
                    } : {
                        dirname: path.substring(0, lastIndex),
                        basename: path.substring(lastIndex + 1)
                    }
                }

                function joinPath() {
                    var nonEmptyPaths = Array.prototype.filter.call(arguments, function(path) {
                            return path
                        }),
                        relevantPaths = [];
                    return nonEmptyPaths.forEach(function(path) {
                        /^\//.test(path) ? relevantPaths = [path] : relevantPaths.push(path)
                    }), relevantPaths.join("/")
                }
                var JSZip = require("jszip"),
                    promises = require("./promises");
                exports.openArrayBuffer = openArrayBuffer, exports.splitPath = splitPath, exports.joinPath = joinPath
            }).call(this, require("buffer").Buffer)
        }, {
            "./promises": 23,
            buffer: 77,
            jszip: 92
        }],
        39: [function(require, module, exports) {
            "use strict";

            function placeHoldersCount(b64) {
                var len = b64.length;
                if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
                return "=" === b64[len - 2] ? 2 : "=" === b64[len - 1] ? 1 : 0
            }

            function byteLength(b64) {
                return 3 * b64.length / 4 - placeHoldersCount(b64)
            }

            function toByteArray(b64) {
                var i, j, l, tmp, placeHolders, arr, len = b64.length;
                placeHolders = placeHoldersCount(b64), arr = new Arr(3 * len / 4 - placeHolders), l = placeHolders > 0 ? len - 4 : len;
                var L = 0;
                for (i = 0, j = 0; l > i; i += 4, j += 3) tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)], arr[L++] = tmp >> 16 & 255, arr[L++] = tmp >> 8 & 255, arr[L++] = 255 & tmp;
                return 2 === placeHolders ? (tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4, arr[L++] = 255 & tmp) : 1 === placeHolders && (tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2, arr[L++] = tmp >> 8 & 255, arr[L++] = 255 & tmp), arr
            }

            function tripletToBase64(num) {
                return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[63 & num]
            }

            function encodeChunk(uint8, start, end) {
                for (var tmp, output = [], i = start; end > i; i += 3) tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2], output.push(tripletToBase64(tmp));
                return output.join("")
            }

            function fromByteArray(uint8) {
                for (var tmp, len = uint8.length, extraBytes = len % 3, output = "", parts = [], maxChunkLength = 16383, i = 0, len2 = len - extraBytes; len2 > i; i += maxChunkLength) parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
                return 1 === extraBytes ? (tmp = uint8[len - 1], output += lookup[tmp >> 2], output += lookup[tmp << 4 & 63], output += "==") : 2 === extraBytes && (tmp = (uint8[len - 2] << 8) + uint8[len - 1], output += lookup[tmp >> 10], output += lookup[tmp >> 4 & 63], output += lookup[tmp << 2 & 63], output += "="), parts.push(output), parts.join("")
            }
            exports.byteLength = byteLength, exports.toByteArray = toByteArray, exports.fromByteArray = fromByteArray;
            for (var lookup = [], revLookup = [], Arr = "undefined" != typeof Uint8Array ? Uint8Array : Array, code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", i = 0, len = code.length; len > i; ++i) lookup[i] = code[i], revLookup[code.charCodeAt(i)] = i;
            revLookup["-".charCodeAt(0)] = 62, revLookup["_".charCodeAt(0)] = 63
        }, {}],
        40: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise) {
                function any(promises) {
                    var ret = new SomePromiseArray(promises),
                        promise = ret.promise();
                    return ret.setHowMany(1), ret.setUnwrap(), ret.init(), promise
                }
                var SomePromiseArray = Promise._SomePromiseArray;
                Promise.any = function(promises) {
                    return any(promises)
                }, Promise.prototype.any = function() {
                    return any(this)
                }
            }
        }, {}],
        41: [function(require, module, exports) {
            (function(process) {
                "use strict";

                function Async() {
                    this._customScheduler = !1, this._isTickUsed = !1, this._lateQueue = new Queue(16), this._normalQueue = new Queue(16), this._haveDrainedQueues = !1, this._trampolineEnabled = !0;
                    var self = this;
                    this.drainQueues = function() {
                        self._drainQueues()
                    }, this._schedule = schedule
                }

                function AsyncInvokeLater(fn, receiver, arg) {
                    this._lateQueue.push(fn, receiver, arg), this._queueTick()
                }

                function AsyncInvoke(fn, receiver, arg) {
                    this._normalQueue.push(fn, receiver, arg), this._queueTick()
                }

                function AsyncSettlePromises(promise) {
                    this._normalQueue._pushOne(promise), this._queueTick()
                }
                var firstLineError;
                try {
                    throw new Error
                } catch (e) {
                    firstLineError = e
                }
                var schedule = require("./schedule"),
                    Queue = require("./queue"),
                    util = require("./util");
                Async.prototype.setScheduler = function(fn) {
                    var prev = this._schedule;
                    return this._schedule = fn, this._customScheduler = !0, prev
                }, Async.prototype.hasCustomScheduler = function() {
                    return this._customScheduler
                }, Async.prototype.enableTrampoline = function() {
                    this._trampolineEnabled = !0
                }, Async.prototype.disableTrampolineIfNecessary = function() {
                    util.hasDevTools && (this._trampolineEnabled = !1)
                }, Async.prototype.haveItemsQueued = function() {
                    return this._isTickUsed || this._haveDrainedQueues
                }, Async.prototype.fatalError = function(e, isNode) {
                    isNode ? (process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) + "\n"), process.exit(2)) : this.throwLater(e)
                }, Async.prototype.throwLater = function(fn, arg) {
                    if (1 === arguments.length && (arg = fn, fn = function() {
                            throw arg
                        }), "undefined" != typeof setTimeout) setTimeout(function() {
                        fn(arg)
                    }, 0);
                    else try {
                        this._schedule(function() {
                            fn(arg)
                        })
                    } catch (e) {
                        throw new Error("No async scheduler available\n\n    See http://goo.gl/MqrFmX\n")
                    }
                }, util.hasDevTools ? (Async.prototype.invokeLater = function(fn, receiver, arg) {
                    this._trampolineEnabled ? AsyncInvokeLater.call(this, fn, receiver, arg) : this._schedule(function() {
                        setTimeout(function() {
                            fn.call(receiver, arg)
                        }, 100)
                    })
                }, Async.prototype.invoke = function(fn, receiver, arg) {
                    this._trampolineEnabled ? AsyncInvoke.call(this, fn, receiver, arg) : this._schedule(function() {
                        fn.call(receiver, arg)
                    })
                }, Async.prototype.settlePromises = function(promise) {
                    this._trampolineEnabled ? AsyncSettlePromises.call(this, promise) : this._schedule(function() {
                        promise._settlePromises()
                    })
                }) : (Async.prototype.invokeLater = AsyncInvokeLater, Async.prototype.invoke = AsyncInvoke, Async.prototype.settlePromises = AsyncSettlePromises), Async.prototype._drainQueue = function(queue) {
                    for (; queue.length() > 0;) {
                        var fn = queue.shift();
                        if ("function" == typeof fn) {
                            var receiver = queue.shift(),
                                arg = queue.shift();
                            fn.call(receiver, arg)
                        } else fn._settlePromises()
                    }
                }, Async.prototype._drainQueues = function() {
                    this._drainQueue(this._normalQueue), this._reset(), this._haveDrainedQueues = !0, this._drainQueue(this._lateQueue)
                }, Async.prototype._queueTick = function() {
                    this._isTickUsed || (this._isTickUsed = !0, this._schedule(this.drainQueues))
                }, Async.prototype._reset = function() {
                    this._isTickUsed = !1
                }, module.exports = Async, module.exports.firstLineError = firstLineError
            }).call(this, require("_process"))
        }, {
            "./queue": 64,
            "./schedule": 67,
            "./util": 74,
            _process: 138
        }],
        42: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
                var calledBind = !1,
                    rejectThis = function(_, e) {
                        this._reject(e)
                    },
                    targetRejected = function(e, context) {
                        context.promiseRejectionQueued = !0, context.bindingPromise._then(rejectThis, rejectThis, null, this, e)
                    },
                    bindingResolved = function(thisArg, context) {
                        0 === (50397184 & this._bitField) && this._resolveCallback(context.target)
                    },
                    bindingRejected = function(e, context) {
                        context.promiseRejectionQueued || this._reject(e)
                    };
                Promise.prototype.bind = function(thisArg) {
                    calledBind || (calledBind = !0, Promise.prototype._propagateFrom = debug.propagateFromFunction(), Promise.prototype._boundValue = debug.boundValueFunction());
                    var maybePromise = tryConvertToPromise(thisArg),
                        ret = new Promise(INTERNAL);
                    ret._propagateFrom(this, 1);
                    var target = this._target();
                    if (ret._setBoundTo(maybePromise), maybePromise instanceof Promise) {
                        var context = {
                            promiseRejectionQueued: !1,
                            promise: ret,
                            target: target,
                            bindingPromise: maybePromise
                        };
                        target._then(INTERNAL, targetRejected, void 0, ret, context), maybePromise._then(bindingResolved, bindingRejected, void 0, ret, context), ret._setOnCancel(maybePromise)
                    } else ret._resolveCallback(target);
                    return ret
                }, Promise.prototype._setBoundTo = function(obj) {
                    void 0 !== obj ? (this._bitField = 2097152 | this._bitField, this._boundTo = obj) : this._bitField = -2097153 & this._bitField
                }, Promise.prototype._isBound = function() {
                    return 2097152 === (2097152 & this._bitField)
                }, Promise.bind = function(thisArg, value) {
                    return Promise.resolve(value).bind(thisArg)
                }
            }
        }, {}],
        43: [function(require, module, exports) {
            "use strict";
            var cr = Object.create;
            if (cr) {
                var callerCache = cr(null),
                    getterCache = cr(null);
                callerCache[" size"] = getterCache[" size"] = 0
            }
            module.exports = function(Promise) {
                function ensureMethod(obj, methodName) {
                    var fn;
                    if (null != obj && (fn = obj[methodName]), "function" != typeof fn) {
                        var message = "Object " + util.classString(obj) + " has no method '" + util.toString(methodName) + "'";
                        throw new Promise.TypeError(message)
                    }
                    return fn
                }

                function caller(obj) {
                    var methodName = this.pop(),
                        fn = ensureMethod(obj, methodName);
                    return fn.apply(obj, this)
                }

                function namedGetter(obj) {
                    return obj[this]
                }

                function indexedGetter(obj) {
                    var index = +this;
                    return 0 > index && (index = Math.max(0, index + obj.length)), obj[index]
                }
                var getMethodCaller, getGetter, util = require("./util"),
                    canEvaluate = util.canEvaluate,
                    isIdentifier = util.isIdentifier,
                    makeMethodCaller = function(methodName) {
                        return new Function("ensureMethod", "                                    \n        return function(obj) {                                               \n            'use strict'                                                     \n            var len = this.length;                                           \n            ensureMethod(obj, 'methodName');                                 \n            switch(len) {                                                    \n                case 1: return obj.methodName(this[0]);                      \n                case 2: return obj.methodName(this[0], this[1]);             \n                case 3: return obj.methodName(this[0], this[1], this[2]);    \n                case 0: return obj.methodName();                             \n                default:                                                     \n                    return obj.methodName.apply(obj, this);                  \n            }                                                                \n        };                                                                   \n        ".replace(/methodName/g, methodName))(ensureMethod)
                    },
                    makeGetter = function(propertyName) {
                        return new Function("obj", "                                             \n        'use strict';                                                        \n        return obj.propertyName;                                             \n        ".replace("propertyName", propertyName))
                    },
                    getCompiled = function(name, compiler, cache) {
                        var ret = cache[name];
                        if ("function" != typeof ret) {
                            if (!isIdentifier(name)) return null;
                            if (ret = compiler(name), cache[name] = ret, cache[" size"]++, cache[" size"] > 512) {
                                for (var keys = Object.keys(cache), i = 0; 256 > i; ++i) delete cache[keys[i]];
                                cache[" size"] = keys.length - 256
                            }
                        }
                        return ret
                    };
                getMethodCaller = function(name) {
                    return getCompiled(name, makeMethodCaller, callerCache)
                }, getGetter = function(name) {
                    return getCompiled(name, makeGetter, getterCache)
                }, Promise.prototype.call = function(methodName) {
                    for (var $_len = arguments.length, args = new Array(Math.max($_len - 1, 0)), $_i = 1; $_len > $_i; ++$_i) args[$_i - 1] = arguments[$_i];
                    if (canEvaluate) {
                        var maybeCaller = getMethodCaller(methodName);
                        if (null !== maybeCaller) return this._then(maybeCaller, void 0, void 0, args, void 0)
                    }
                    return args.push(methodName), this._then(caller, void 0, void 0, args, void 0)
                }, Promise.prototype.get = function(propertyName) {
                    var getter, isIndex = "number" == typeof propertyName;
                    if (isIndex) getter = indexedGetter;
                    else if (canEvaluate) {
                        var maybeGetter = getGetter(propertyName);
                        getter = null !== maybeGetter ? maybeGetter : namedGetter
                    } else getter = namedGetter;
                    return this._then(getter, void 0, void 0, propertyName, void 0)
                }
            }
        }, {
            "./util": 74
        }],
        44: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, PromiseArray, apiRejection, debug) {
                var util = require("./util"),
                    tryCatch = util.tryCatch,
                    errorObj = util.errorObj,
                    async = Promise._async;
                Promise.prototype["break"] = Promise.prototype.cancel = function() {
                    if (!debug.cancellation()) return this._warn("cancellation is disabled");
                    for (var promise = this, child = promise; promise._isCancellable();) {
                        if (!promise._cancelBy(child)) {
                            child._isFollowing() ? child._followee().cancel() : child._cancelBranched();
                            break
                        }
                        var parent = promise._cancellationParent;
                        if (null == parent || !parent._isCancellable()) {
                            promise._isFollowing() ? promise._followee().cancel() : promise._cancelBranched();
                            break
                        }
                        promise._isFollowing() && promise._followee().cancel(), promise._setWillBeCancelled(), child = promise, promise = parent
                    }
                }, Promise.prototype._branchHasCancelled = function() {
                    this._branchesRemainingToCancel--
                }, Promise.prototype._enoughBranchesHaveCancelled = function() {
                    return void 0 === this._branchesRemainingToCancel || this._branchesRemainingToCancel <= 0
                }, Promise.prototype._cancelBy = function(canceller) {
                    return canceller === this ? (this._branchesRemainingToCancel = 0, this._invokeOnCancel(), !0) : (this._branchHasCancelled(), this._enoughBranchesHaveCancelled() ? (this._invokeOnCancel(), !0) : !1)
                }, Promise.prototype._cancelBranched = function() {
                    this._enoughBranchesHaveCancelled() && this._cancel()
                }, Promise.prototype._cancel = function() {
                    this._isCancellable() && (this._setCancelled(), async.invoke(this._cancelPromises, this, void 0))
                }, Promise.prototype._cancelPromises = function() {
                    this._length() > 0 && this._settlePromises()
                }, Promise.prototype._unsetOnCancel = function() {
                    this._onCancelField = void 0
                }, Promise.prototype._isCancellable = function() {
                    return this.isPending() && !this._isCancelled()
                }, Promise.prototype.isCancellable = function() {
                    return this.isPending() && !this.isCancelled()
                }, Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
                    if (util.isArray(onCancelCallback))
                        for (var i = 0; i < onCancelCallback.length; ++i) this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
                    else if (void 0 !== onCancelCallback)
                        if ("function" == typeof onCancelCallback) {
                            if (!internalOnly) {
                                var e = tryCatch(onCancelCallback).call(this._boundValue());
                                e === errorObj && (this._attachExtraTrace(e.e), async.throwLater(e.e))
                            }
                        } else onCancelCallback._resultCancelled(this)
                }, Promise.prototype._invokeOnCancel = function() {
                    var onCancelCallback = this._onCancel();
                    this._unsetOnCancel(), async.invoke(this._doInvokeOnCancel, this, onCancelCallback)
                }, Promise.prototype._invokeInternalOnCancel = function() {
                    this._isCancellable() && (this._doInvokeOnCancel(this._onCancel(), !0), this._unsetOnCancel())
                }, Promise.prototype._resultCancelled = function() {
                    this.cancel()
                }
            }
        }, {
            "./util": 74
        }],
        45: [function(require, module, exports) {
            "use strict";
            module.exports = function(NEXT_FILTER) {
                function catchFilter(instances, cb, promise) {
                    return function(e) {
                        var boundTo = promise._boundValue();
                        predicateLoop: for (var i = 0; i < instances.length; ++i) {
                            var item = instances[i];
                            if (item === Error || null != item && item.prototype instanceof Error) {
                                if (e instanceof item) return tryCatch(cb).call(boundTo, e)
                            } else if ("function" == typeof item) {
                                var matchesPredicate = tryCatch(item).call(boundTo, e);
                                if (matchesPredicate === errorObj) return matchesPredicate;
                                if (matchesPredicate) return tryCatch(cb).call(boundTo, e)
                            } else if (util.isObject(e)) {
                                for (var keys = getKeys(item), j = 0; j < keys.length; ++j) {
                                    var key = keys[j];
                                    if (item[key] != e[key]) continue predicateLoop
                                }
                                return tryCatch(cb).call(boundTo, e)
                            }
                        }
                        return NEXT_FILTER
                    }
                }
                var util = require("./util"),
                    getKeys = require("./es5").keys,
                    tryCatch = util.tryCatch,
                    errorObj = util.errorObj;
                return catchFilter
            }
        }, {
            "./es5": 51,
            "./util": 74
        }],
        46: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise) {
                function Context() {
                    this._trace = new Context.CapturedTrace(peekContext())
                }

                function createContext() {
                    return longStackTraces ? new Context : void 0
                }

                function peekContext() {
                    var lastIndex = contextStack.length - 1;
                    return lastIndex >= 0 ? contextStack[lastIndex] : void 0
                }
                var longStackTraces = !1,
                    contextStack = [];
                return Promise.prototype._promiseCreated = function() {}, Promise.prototype._pushContext = function() {}, Promise.prototype._popContext = function() {
                    return null
                }, Promise._peekContext = Promise.prototype._peekContext = function() {}, Context.prototype._pushContext = function() {
                    void 0 !== this._trace && (this._trace._promiseCreated = null, contextStack.push(this._trace))
                }, Context.prototype._popContext = function() {
                    if (void 0 !== this._trace) {
                        var trace = contextStack.pop(),
                            ret = trace._promiseCreated;
                        return trace._promiseCreated = null, ret
                    }
                    return null
                }, Context.CapturedTrace = null, Context.create = createContext, Context.deactivateLongStackTraces = function() {}, Context.activateLongStackTraces = function() {
                    var Promise_pushContext = Promise.prototype._pushContext,
                        Promise_popContext = Promise.prototype._popContext,
                        Promise_PeekContext = Promise._peekContext,
                        Promise_peekContext = Promise.prototype._peekContext,
                        Promise_promiseCreated = Promise.prototype._promiseCreated;
                    Context.deactivateLongStackTraces = function() {
                        Promise.prototype._pushContext = Promise_pushContext, Promise.prototype._popContext = Promise_popContext, Promise._peekContext = Promise_PeekContext, Promise.prototype._peekContext = Promise_peekContext, Promise.prototype._promiseCreated = Promise_promiseCreated, longStackTraces = !1
                    }, longStackTraces = !0, Promise.prototype._pushContext = Context.prototype._pushContext, Promise.prototype._popContext = Context.prototype._popContext, Promise._peekContext = Promise.prototype._peekContext = peekContext, Promise.prototype._promiseCreated = function() {
                        var ctx = this._peekContext();
                        ctx && null == ctx._promiseCreated && (ctx._promiseCreated = this)
                    }
                }, Context
            }
        }, {}],
        47: [function(require, module, exports) {
            (function(process) {
                "use strict";
                module.exports = function(Promise, Context) {
                    function generatePromiseLifecycleEventObject(name, promise) {
                        return {
                            promise: promise
                        }
                    }

                    function defaultFireEvent() {
                        return !1
                    }

                    function cancellationExecute(executor, resolve, reject) {
                        var promise = this;
                        try {
                            executor(resolve, reject, function(onCancel) {
                                if ("function" != typeof onCancel) throw new TypeError("onCancel must be a function, got: " + util.toString(onCancel));
                                promise._attachCancellationCallback(onCancel)
                            })
                        } catch (e) {
                            return e
                        }
                    }

                    function cancellationAttachCancellationCallback(onCancel) {
                        if (!this._isCancellable()) return this;
                        var previousOnCancel = this._onCancel();
                        void 0 !== previousOnCancel ? util.isArray(previousOnCancel) ? previousOnCancel.push(onCancel) : this._setOnCancel([previousOnCancel, onCancel]) : this._setOnCancel(onCancel)
                    }

                    function cancellationOnCancel() {
                        return this._onCancelField
                    }

                    function cancellationSetOnCancel(onCancel) {
                        this._onCancelField = onCancel
                    }

                    function cancellationClearCancellationData() {
                        this._cancellationParent = void 0, this._onCancelField = void 0
                    }

                    function cancellationPropagateFrom(parent, flags) {
                        if (0 !== (1 & flags)) {
                            this._cancellationParent = parent;
                            var branchesRemainingToCancel = parent._branchesRemainingToCancel;
                            void 0 === branchesRemainingToCancel && (branchesRemainingToCancel = 0), parent._branchesRemainingToCancel = branchesRemainingToCancel + 1
                        }
                        0 !== (2 & flags) && parent._isBound() && this._setBoundTo(parent._boundTo)
                    }

                    function bindingPropagateFrom(parent, flags) {
                        0 !== (2 & flags) && parent._isBound() && this._setBoundTo(parent._boundTo)
                    }

                    function boundValueFunction() {
                        var ret = this._boundTo;
                        return void 0 !== ret && ret instanceof Promise ? ret.isFulfilled() ? ret.value() : void 0 : ret
                    }

                    function longStackTracesCaptureStackTrace() {
                        this._trace = new CapturedTrace(this._peekContext())
                    }

                    function longStackTracesAttachExtraTrace(error, ignoreSelf) {
                        if (canAttachTrace(error)) {
                            var trace = this._trace;
                            if (void 0 !== trace && ignoreSelf && (trace = trace._parent), void 0 !== trace) trace.attachExtraTrace(error);
                            else if (!error.__stackCleaned__) {
                                var parsed = parseStackAndMessage(error);
                                util.notEnumerableProp(error, "stack", parsed.message + "\n" + parsed.stack.join("\n")), util.notEnumerableProp(error, "__stackCleaned__", !0)
                            }
                        }
                    }

                    function checkForgottenReturns(returnValue, promiseCreated, name, promise, parent) {
                        if (void 0 === returnValue && null !== promiseCreated && wForgottenReturn) {
                            if (void 0 !== parent && parent._returnedNonUndefined()) return;
                            if (0 === (65535 & promise._bitField)) return;
                            name && (name += " ");
                            var handlerLine = "",
                                creatorLine = "";
                            if (promiseCreated._trace) {
                                for (var traceLines = promiseCreated._trace.stack.split("\n"), stack = cleanStack(traceLines), i = stack.length - 1; i >= 0; --i) {
                                    var line = stack[i];
                                    if (!nodeFramePattern.test(line)) {
                                        var lineMatches = line.match(parseLinePattern);
                                        lineMatches && (handlerLine = "at " + lineMatches[1] + ":" + lineMatches[2] + ":" + lineMatches[3] + " ");
                                        break
                                    }
                                }
                                if (stack.length > 0)
                                    for (var firstUserLine = stack[0], i = 0; i < traceLines.length; ++i)
                                        if (traceLines[i] === firstUserLine) {
                                            i > 0 && (creatorLine = "\n" + traceLines[i - 1]);
                                            break
                                        }
                            }
                            var msg = "a promise was created in a " + name + "handler " + handlerLine + "but was not returned from it, see http://goo.gl/rRqMUw" + creatorLine;
                            promise._warn(msg, !0, promiseCreated)
                        }
                    }

                    function deprecated(name, replacement) {
                        var message = name + " is deprecated and will be removed in a future version.";
                        return replacement && (message += " Use " + replacement + " instead."), warn(message)
                    }

                    function warn(message, shouldUseOwnTrace, promise) {
                        if (config.warnings) {
                            var ctx, warning = new Warning(message);
                            if (shouldUseOwnTrace) promise._attachExtraTrace(warning);
                            else if (config.longStackTraces && (ctx = Promise._peekContext())) ctx.attachExtraTrace(warning);
                            else {
                                var parsed = parseStackAndMessage(warning);
                                warning.stack = parsed.message + "\n" + parsed.stack.join("\n")
                            }
                            activeFireEvent("warning", warning) || formatAndLogError(warning, "", !0)
                        }
                    }

                    function reconstructStack(message, stacks) {
                        for (var i = 0; i < stacks.length - 1; ++i) stacks[i].push("From previous event:"), stacks[i] = stacks[i].join("\n");
                        return i < stacks.length && (stacks[i] = stacks[i].join("\n")), message + "\n" + stacks.join("\n")
                    }

                    function removeDuplicateOrEmptyJumps(stacks) {
                        for (var i = 0; i < stacks.length; ++i)(0 === stacks[i].length || i + 1 < stacks.length && stacks[i][0] === stacks[i + 1][0]) && (stacks.splice(i, 1), i--)
                    }

                    function removeCommonRoots(stacks) {
                        for (var current = stacks[0], i = 1; i < stacks.length; ++i) {
                            for (var prev = stacks[i], currentLastIndex = current.length - 1, currentLastLine = current[currentLastIndex], commonRootMeetPoint = -1, j = prev.length - 1; j >= 0; --j)
                                if (prev[j] === currentLastLine) {
                                    commonRootMeetPoint = j;
                                    break
                                } for (var j = commonRootMeetPoint; j >= 0; --j) {
                                var line = prev[j];
                                if (current[currentLastIndex] !== line) break;
                                current.pop(), currentLastIndex--
                            }
                            current = prev
                        }
                    }

                    function cleanStack(stack) {
                        for (var ret = [], i = 0; i < stack.length; ++i) {
                            var line = stack[i],
                                isTraceLine = "    (No stack trace)" === line || stackFramePattern.test(line),
                                isInternalFrame = isTraceLine && shouldIgnore(line);
                            isTraceLine && !isInternalFrame && (indentStackFrames && " " !== line.charAt(0) && (line = "    " + line), ret.push(line))
                        }
                        return ret
                    }

                    function stackFramesAsArray(error) {
                        for (var stack = error.stack.replace(/\s+$/g, "").split("\n"), i = 0; i < stack.length; ++i) {
                            var line = stack[i];
                            if ("    (No stack trace)" === line || stackFramePattern.test(line)) break
                        }
                        return i > 0 && "SyntaxError" != error.name && (stack = stack.slice(i)), stack
                    }

                    function parseStackAndMessage(error) {
                        var stack = error.stack,
                            message = error.toString();
                        return stack = "string" == typeof stack && stack.length > 0 ? stackFramesAsArray(error) : ["    (No stack trace)"], {
                            message: message,
                            stack: "SyntaxError" == error.name ? stack : cleanStack(stack)
                        }
                    }

                    function formatAndLogError(error, title, isSoft) {
                        if ("undefined" != typeof console) {
                            var message;
                            if (util.isObject(error)) {
                                var stack = error.stack;
                                message = title + formatStack(stack, error)
                            } else message = title + String(error);
                            "function" == typeof printWarning ? printWarning(message, isSoft) : ("function" == typeof console.log || "object" == typeof console.log) && console.log(message)
                        }
                    }

                    function fireRejectionEvent(name, localHandler, reason, promise) {
                        var localEventFired = !1;
                        try {
                            "function" == typeof localHandler && (localEventFired = !0, "rejectionHandled" === name ? localHandler(promise) : localHandler(reason, promise))
                        } catch (e) {
                            async.throwLater(e)
                        }
                        "unhandledRejection" === name ? activeFireEvent(name, reason, promise) || localEventFired || formatAndLogError(reason, "Unhandled rejection ") : activeFireEvent(name, promise)
                    }

                    function formatNonError(obj) {
                        var str;
                        if ("function" == typeof obj) str = "[function " + (obj.name || "anonymous") + "]";
                        else {
                            str = obj && "function" == typeof obj.toString ? obj.toString() : util.toString(obj);
                            var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
                            if (ruselessToString.test(str)) try {
                                var newStr = JSON.stringify(obj);
                                str = newStr
                            } catch (e) {}
                            0 === str.length && (str = "(empty array)")
                        }
                        return "(<" + snip(str) + ">, no stack trace)"
                    }

                    function snip(str) {
                        var maxChars = 41;
                        return str.length < maxChars ? str : str.substr(0, maxChars - 3) + "..."
                    }

                    function longStackTracesIsSupported() {
                        return "function" == typeof captureStackTrace
                    }

                    function parseLineInfo(line) {
                        var matches = line.match(parseLineInfoRegex);
                        return matches ? {
                            fileName: matches[1],
                            line: parseInt(matches[2], 10)
                        } : void 0
                    }

                    function setBounds(firstLineError, lastLineError) {
                        if (longStackTracesIsSupported()) {
                            for (var firstFileName, lastFileName, firstStackLines = firstLineError.stack.split("\n"), lastStackLines = lastLineError.stack.split("\n"), firstIndex = -1, lastIndex = -1, i = 0; i < firstStackLines.length; ++i) {
                                var result = parseLineInfo(firstStackLines[i]);
                                if (result) {
                                    firstFileName = result.fileName, firstIndex = result.line;
                                    break
                                }
                            }
                            for (var i = 0; i < lastStackLines.length; ++i) {
                                var result = parseLineInfo(lastStackLines[i]);
                                if (result) {
                                    lastFileName = result.fileName, lastIndex = result.line;
                                    break
                                }
                            }
                            0 > firstIndex || 0 > lastIndex || !firstFileName || !lastFileName || firstFileName !== lastFileName || firstIndex >= lastIndex || (shouldIgnore = function(line) {
                                if (bluebirdFramePattern.test(line)) return !0;
                                var info = parseLineInfo(line);
                                return info && info.fileName === firstFileName && firstIndex <= info.line && info.line <= lastIndex ? !0 : !1
                            })
                        }
                    }

                    function CapturedTrace(parent) {
                        this._parent = parent, this._promisesCreated = 0;
                        var length = this._length = 1 + (void 0 === parent ? 0 : parent._length);
                        captureStackTrace(this, CapturedTrace), length > 32 && this.uncycle()
                    }
                    var unhandledRejectionHandled, possiblyUnhandledRejection, printWarning, getDomain = Promise._getDomain,
                        async = Promise._async, Warning = require("./errors").Warning, util = require("./util"), canAttachTrace = util.canAttachTrace, bluebirdFramePattern = /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/, nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/, parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/, stackFramePattern = null, formatStack = null, indentStackFrames = !1, debugging = !(0 == util.env("BLUEBIRD_DEBUG") || !util.env("BLUEBIRD_DEBUG") && "development" !== util.env("NODE_ENV")), warnings = !(0 == util.env("BLUEBIRD_WARNINGS") || !debugging && !util.env("BLUEBIRD_WARNINGS")), longStackTraces = !(0 == util.env("BLUEBIRD_LONG_STACK_TRACES") || !debugging && !util.env("BLUEBIRD_LONG_STACK_TRACES")), wForgottenReturn = 0 != util.env("BLUEBIRD_W_FORGOTTEN_RETURN") && (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));
                    Promise.prototype.suppressUnhandledRejections = function() {
                        var target = this._target();
                        target._bitField = -1048577 & target._bitField | 524288
                    }, Promise.prototype._ensurePossibleRejectionHandled = function() {
                        0 === (524288 & this._bitField) && (this._setRejectionIsUnhandled(), async.invokeLater(this._notifyUnhandledRejection, this, void 0))
                    }, Promise.prototype._notifyUnhandledRejectionIsHandled = function() {
                        fireRejectionEvent("rejectionHandled", unhandledRejectionHandled, void 0, this)
                    }, Promise.prototype._setReturnedNonUndefined = function() {
                        this._bitField = 268435456 | this._bitField
                    }, Promise.prototype._returnedNonUndefined = function() {
                        return 0 !== (268435456 & this._bitField)
                    }, Promise.prototype._notifyUnhandledRejection = function() {
                        if (this._isRejectionUnhandled()) {
                            var reason = this._settledValue();
                            this._setUnhandledRejectionIsNotified(), fireRejectionEvent("unhandledRejection", possiblyUnhandledRejection, reason, this)
                        }
                    }, Promise.prototype._setUnhandledRejectionIsNotified = function() {
                        this._bitField = 262144 | this._bitField
                    }, Promise.prototype._unsetUnhandledRejectionIsNotified = function() {
                        this._bitField = -262145 & this._bitField
                    }, Promise.prototype._isUnhandledRejectionNotified = function() {
                        return (262144 & this._bitField) > 0
                    }, Promise.prototype._setRejectionIsUnhandled = function() {
                        this._bitField = 1048576 | this._bitField
                    }, Promise.prototype._unsetRejectionIsUnhandled = function() {
                        this._bitField = -1048577 & this._bitField, this._isUnhandledRejectionNotified() && (this._unsetUnhandledRejectionIsNotified(), this._notifyUnhandledRejectionIsHandled())
                    }, Promise.prototype._isRejectionUnhandled = function() {
                        return (1048576 & this._bitField) > 0
                    }, Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
                        return warn(message, shouldUseOwnTrace, promise || this)
                    }, Promise.onPossiblyUnhandledRejection = function(fn) {
                        var domain = getDomain();
                        possiblyUnhandledRejection = "function" == typeof fn ? null === domain ? fn : util.domainBind(domain, fn) : void 0
                    }, Promise.onUnhandledRejectionHandled = function(fn) {
                        var domain = getDomain();
                        unhandledRejectionHandled = "function" == typeof fn ? null === domain ? fn : util.domainBind(domain, fn) : void 0
                    };
                    var disableLongStackTraces = function() {};
                    Promise.longStackTraces = function() {
                        if (async.haveItemsQueued() && !config.longStackTraces) throw new Error("cannot enable long stack traces after promises have been created\n\n    See http://goo.gl/MqrFmX\n");
                        if (!config.longStackTraces && longStackTracesIsSupported()) {
                            var Promise_captureStackTrace = Promise.prototype._captureStackTrace,
                                Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
                            config.longStackTraces = !0, disableLongStackTraces = function() {
                                if (async.haveItemsQueued() && !config.longStackTraces) throw new Error("cannot enable long stack traces after promises have been created\n\n    See http://goo.gl/MqrFmX\n");
                                Promise.prototype._captureStackTrace = Promise_captureStackTrace, Promise.prototype._attachExtraTrace = Promise_attachExtraTrace, Context.deactivateLongStackTraces(), async.enableTrampoline(), config.longStackTraces = !1
                            }, Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace, Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace, Context.activateLongStackTraces(), async.disableTrampolineIfNecessary()
                        }
                    }, Promise.hasLongStackTraces = function() {
                        return config.longStackTraces && longStackTracesIsSupported()
                    };
                    var fireDomEvent = function() {
                            try {
                                if ("function" == typeof CustomEvent) {
                                    var event = new CustomEvent("CustomEvent");
                                    return util.global.dispatchEvent(event),
                                        function(name, event) {
                                            var domEvent = new CustomEvent(name.toLowerCase(), {
                                                detail: event,
                                                cancelable: !0
                                            });
                                            return !util.global.dispatchEvent(domEvent)
                                        }
                                }
                                if ("function" == typeof Event) {
                                    var event = new Event("CustomEvent");
                                    return util.global.dispatchEvent(event),
                                        function(name, event) {
                                            var domEvent = new Event(name.toLowerCase(), {
                                                cancelable: !0
                                            });
                                            return domEvent.detail = event, !util.global.dispatchEvent(domEvent)
                                        }
                                }
                                var event = document.createEvent("CustomEvent");
                                return event.initCustomEvent("testingtheevent", !1, !0, {}), util.global.dispatchEvent(event),
                                    function(name, event) {
                                        var domEvent = document.createEvent("CustomEvent");
                                        return domEvent.initCustomEvent(name.toLowerCase(), !1, !0, event), !util.global.dispatchEvent(domEvent)
                                    }
                            } catch (e) {}
                            return function() {
                                return !1
                            }
                        }(),
                        fireGlobalEvent = function() {
                            return util.isNode ? function() {
                                return process.emit.apply(process, arguments)
                            } : util.global ? function(name) {
                                var methodName = "on" + name.toLowerCase(),
                                    method = util.global[methodName];
                                return method ? (method.apply(util.global, [].slice.call(arguments, 1)), !0) : !1
                            } : function() {
                                return !1
                            }
                        }(),
                        eventToObjectGenerator = {
                            promiseCreated: generatePromiseLifecycleEventObject,
                            promiseFulfilled: generatePromiseLifecycleEventObject,
                            promiseRejected: generatePromiseLifecycleEventObject,
                            promiseResolved: generatePromiseLifecycleEventObject,
                            promiseCancelled: generatePromiseLifecycleEventObject,
                            promiseChained: function(name, promise, child) {
                                return {
                                    promise: promise,
                                    child: child
                                }
                            },
                            warning: function(name, warning) {
                                return {
                                    warning: warning
                                }
                            },
                            unhandledRejection: function(name, reason, promise) {
                                return {
                                    reason: reason,
                                    promise: promise
                                }
                            },
                            rejectionHandled: generatePromiseLifecycleEventObject
                        },
                        activeFireEvent = function(name) {
                            var globalEventFired = !1;
                            try {
                                globalEventFired = fireGlobalEvent.apply(null, arguments)
                            } catch (e) {
                                async.throwLater(e), globalEventFired = !0
                            }
                            var domEventFired = !1;
                            try {
                                domEventFired = fireDomEvent(name, eventToObjectGenerator[name].apply(null, arguments))
                            } catch (e) {
                                async.throwLater(e), domEventFired = !0
                            }
                            return domEventFired || globalEventFired
                        };
                    Promise.config = function(opts) {
                        if (opts = Object(opts), "longStackTraces" in opts && (opts.longStackTraces ? Promise.longStackTraces() : !opts.longStackTraces && Promise.hasLongStackTraces() && disableLongStackTraces()), "warnings" in opts) {
                            var warningsOption = opts.warnings;
                            config.warnings = !!warningsOption, wForgottenReturn = config.warnings, util.isObject(warningsOption) && "wForgottenReturn" in warningsOption && (wForgottenReturn = !!warningsOption.wForgottenReturn)
                        }
                        if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
                            if (async.haveItemsQueued()) throw new Error("cannot enable cancellation after promises are in use");
                            Promise.prototype._clearCancellationData = cancellationClearCancellationData, Promise.prototype._propagateFrom = cancellationPropagateFrom, Promise.prototype._onCancel = cancellationOnCancel, Promise.prototype._setOnCancel = cancellationSetOnCancel, Promise.prototype._attachCancellationCallback = cancellationAttachCancellationCallback, Promise.prototype._execute = cancellationExecute, propagateFromFunction = cancellationPropagateFrom, config.cancellation = !0
                        }
                        return "monitoring" in opts && (opts.monitoring && !config.monitoring ? (config.monitoring = !0, Promise.prototype._fireEvent = activeFireEvent) : !opts.monitoring && config.monitoring && (config.monitoring = !1, Promise.prototype._fireEvent = defaultFireEvent)), Promise
                    }, Promise.prototype._fireEvent = defaultFireEvent, Promise.prototype._execute = function(executor, resolve, reject) {
                        try {
                            executor(resolve, reject)
                        } catch (e) {
                            return e
                        }
                    }, Promise.prototype._onCancel = function() {}, Promise.prototype._setOnCancel = function(handler) {}, Promise.prototype._attachCancellationCallback = function(onCancel) {}, Promise.prototype._captureStackTrace = function() {}, Promise.prototype._attachExtraTrace = function() {}, Promise.prototype._clearCancellationData = function() {}, Promise.prototype._propagateFrom = function(parent, flags) {};
                    var propagateFromFunction = bindingPropagateFrom,
                        shouldIgnore = function() {
                            return !1
                        },
                        parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
                    util.inherits(CapturedTrace, Error), Context.CapturedTrace = CapturedTrace, CapturedTrace.prototype.uncycle = function() {
                        var length = this._length;
                        if (!(2 > length)) {
                            for (var nodes = [], stackToIndex = {}, i = 0, node = this; void 0 !== node; ++i) nodes.push(node), node = node._parent;
                            length = this._length = i;
                            for (var i = length - 1; i >= 0; --i) {
                                var stack = nodes[i].stack;
                                void 0 === stackToIndex[stack] && (stackToIndex[stack] = i)
                            }
                            for (var i = 0; length > i; ++i) {
                                var currentStack = nodes[i].stack,
                                    index = stackToIndex[currentStack];
                                if (void 0 !== index && index !== i) {
                                    index > 0 && (nodes[index - 1]._parent = void 0, nodes[index - 1]._length = 1), nodes[i]._parent = void 0, nodes[i]._length = 1;
                                    var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;
                                    length - 1 > index ? (cycleEdgeNode._parent = nodes[index + 1], cycleEdgeNode._parent.uncycle(), cycleEdgeNode._length = cycleEdgeNode._parent._length + 1) : (cycleEdgeNode._parent = void 0, cycleEdgeNode._length = 1);
                                    for (var currentChildLength = cycleEdgeNode._length + 1, j = i - 2; j >= 0; --j) nodes[j]._length = currentChildLength, currentChildLength++;
                                    return
                                }
                            }
                        }
                    }, CapturedTrace.prototype.attachExtraTrace = function(error) {
                        if (!error.__stackCleaned__) {
                            this.uncycle();
                            for (var parsed = parseStackAndMessage(error), message = parsed.message, stacks = [parsed.stack], trace = this; void 0 !== trace;) stacks.push(cleanStack(trace.stack.split("\n"))), trace = trace._parent;
                            removeCommonRoots(stacks), removeDuplicateOrEmptyJumps(stacks), util.notEnumerableProp(error, "stack", reconstructStack(message, stacks)), util.notEnumerableProp(error, "__stackCleaned__", !0)
                        }
                    };
                    var captureStackTrace = function() {
                        var v8stackFramePattern = /^\s*at\s*/,
                            v8stackFormatter = function(stack, error) {
                                return "string" == typeof stack ? stack : void 0 !== error.name && void 0 !== error.message ? error.toString() : formatNonError(error)
                            };
                        if ("number" == typeof Error.stackTraceLimit && "function" == typeof Error.captureStackTrace) {
                            Error.stackTraceLimit += 6, stackFramePattern = v8stackFramePattern, formatStack = v8stackFormatter;
                            var captureStackTrace = Error.captureStackTrace;
                            return shouldIgnore = function(line) {
                                    return bluebirdFramePattern.test(line)
                                },
                                function(receiver, ignoreUntil) {
                                    Error.stackTraceLimit += 6, captureStackTrace(receiver, ignoreUntil), Error.stackTraceLimit -= 6
                                }
                        }
                        var err = new Error;
                        if ("string" == typeof err.stack && err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) return stackFramePattern = /@/, formatStack = v8stackFormatter, indentStackFrames = !0,
                            function(o) {
                                o.stack = (new Error).stack
                            };
                        var hasStackAfterThrow;
                        try {
                            throw new Error
                        } catch (e) {
                            hasStackAfterThrow = "stack" in e
                        }
                        return "stack" in err || !hasStackAfterThrow || "number" != typeof Error.stackTraceLimit ? (formatStack = function(stack, error) {
                            return "string" == typeof stack ? stack : "object" != typeof error && "function" != typeof error || void 0 === error.name || void 0 === error.message ? formatNonError(error) : error.toString()
                        }, null) : (stackFramePattern = v8stackFramePattern, formatStack = v8stackFormatter, function(o) {
                            Error.stackTraceLimit += 6;
                            try {
                                throw new Error
                            } catch (e) {
                                o.stack = e.stack
                            }
                            Error.stackTraceLimit -= 6
                        })
                    }([]);
                    "undefined" != typeof console && "undefined" != typeof console.warn && (printWarning = function(message) {
                        console.warn(message)
                    }, util.isNode && process.stderr.isTTY ? printWarning = function(message, isSoft) {
                        var color = isSoft ? "[33m" : "[31m";
                        console.warn(color + message + "[0m\n")
                    } : util.isNode || "string" != typeof(new Error).stack || (printWarning = function(message, isSoft) {
                        console.warn("%c" + message, isSoft ? "color: darkorange" : "color: red")
                    }));
                    var config = {
                        warnings: warnings,
                        longStackTraces: !1,
                        cancellation: !1,
                        monitoring: !1
                    };
                    return longStackTraces && Promise.longStackTraces(), {
                        longStackTraces: function() {
                            return config.longStackTraces
                        },
                        warnings: function() {
                            return config.warnings
                        },
                        cancellation: function() {
                            return config.cancellation
                        },
                        monitoring: function() {
                            return config.monitoring
                        },
                        propagateFromFunction: function() {
                            return propagateFromFunction
                        },
                        boundValueFunction: function() {
                            return boundValueFunction
                        },
                        checkForgottenReturns: checkForgottenReturns,
                        setBounds: setBounds,
                        warn: warn,
                        deprecated: deprecated,
                        CapturedTrace: CapturedTrace,
                        fireDomEvent: fireDomEvent,
                        fireGlobalEvent: fireGlobalEvent
                    }
                }
            }).call(this, require("_process"))
        }, {
            "./errors": 50,
            "./util": 74,
            _process: 138
        }],
        48: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise) {
                function returner() {
                    return this.value
                }

                function thrower() {
                    throw this.reason
                }
                Promise.prototype["return"] = Promise.prototype.thenReturn = function(value) {
                    return value instanceof Promise && value.suppressUnhandledRejections(), this._then(returner, void 0, void 0, {
                        value: value
                    }, void 0)
                }, Promise.prototype["throw"] = Promise.prototype.thenThrow = function(reason) {
                    return this._then(thrower, void 0, void 0, {
                        reason: reason
                    }, void 0)
                }, Promise.prototype.catchThrow = function(reason) {
                    if (arguments.length <= 1) return this._then(void 0, thrower, void 0, {
                        reason: reason
                    }, void 0);
                    var _reason = arguments[1],
                        handler = function() {
                            throw _reason
                        };
                    return this.caught(reason, handler)
                }, Promise.prototype.catchReturn = function(value) {
                    if (arguments.length <= 1) return value instanceof Promise && value.suppressUnhandledRejections(), this._then(void 0, returner, void 0, {
                        value: value
                    }, void 0);
                    var _value = arguments[1];
                    _value instanceof Promise && _value.suppressUnhandledRejections();
                    var handler = function() {
                        return _value
                    };
                    return this.caught(value, handler)
                }
            }
        }, {}],
        49: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL) {
                function promiseAllThis() {
                    return PromiseAll(this)
                }

                function PromiseMapSeries(promises, fn) {
                    return PromiseReduce(promises, fn, INTERNAL, INTERNAL)
                }
                var PromiseReduce = Promise.reduce,
                    PromiseAll = Promise.all;
                Promise.prototype.each = function(fn) {
                    return PromiseReduce(this, fn, INTERNAL, 0)._then(promiseAllThis, void 0, void 0, this, void 0)
                }, Promise.prototype.mapSeries = function(fn) {
                    return PromiseReduce(this, fn, INTERNAL, INTERNAL)
                }, Promise.each = function(promises, fn) {
                    return PromiseReduce(promises, fn, INTERNAL, 0)._then(promiseAllThis, void 0, void 0, promises, void 0)
                }, Promise.mapSeries = PromiseMapSeries
            }
        }, {}],
        50: [function(require, module, exports) {
            "use strict";

            function subError(nameProperty, defaultMessage) {
                function SubError(message) {
                    return this instanceof SubError ? (notEnumerableProp(this, "message", "string" == typeof message ? message : defaultMessage), notEnumerableProp(this, "name", nameProperty), void(Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : Error.call(this))) : new SubError(message)
                }
                return inherits(SubError, Error), SubError
            }

            function OperationalError(message) {
                return this instanceof OperationalError ? (notEnumerableProp(this, "name", "OperationalError"), notEnumerableProp(this, "message", message), this.cause = message, this.isOperational = !0, void(message instanceof Error ? (notEnumerableProp(this, "message", message.message), notEnumerableProp(this, "stack", message.stack)) : Error.captureStackTrace && Error.captureStackTrace(this, this.constructor))) : new OperationalError(message)
            }
            var _TypeError, _RangeError, es5 = require("./es5"),
                Objectfreeze = es5.freeze,
                util = require("./util"),
                inherits = util.inherits,
                notEnumerableProp = util.notEnumerableProp,
                Warning = subError("Warning", "warning"),
                CancellationError = subError("CancellationError", "cancellation error"),
                TimeoutError = subError("TimeoutError", "timeout error"),
                AggregateError = subError("AggregateError", "aggregate error");
            try {
                _TypeError = TypeError, _RangeError = RangeError
            } catch (e) {
                _TypeError = subError("TypeError", "type error"), _RangeError = subError("RangeError", "range error")
            }
            for (var methods = "join pop push shift unshift slice filter forEach some every map indexOf lastIndexOf reduce reduceRight sort reverse".split(" "), i = 0; i < methods.length; ++i) "function" == typeof Array.prototype[methods[i]] && (AggregateError.prototype[methods[i]] = Array.prototype[methods[i]]);
            es5.defineProperty(AggregateError.prototype, "length", {
                value: 0,
                configurable: !1,
                writable: !0,
                enumerable: !0
            }), AggregateError.prototype.isOperational = !0;
            var level = 0;
            AggregateError.prototype.toString = function() {
                var indent = Array(4 * level + 1).join(" "),
                    ret = "\n" + indent + "AggregateError of:\n";
                level++, indent = Array(4 * level + 1).join(" ");
                for (var i = 0; i < this.length; ++i) {
                    for (var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "", lines = str.split("\n"), j = 0; j < lines.length; ++j) lines[j] = indent + lines[j];
                    str = lines.join("\n"), ret += str + "\n"
                }
                return level--, ret
            }, inherits(OperationalError, Error);
            var errorTypes = Error.__BluebirdErrorTypes__;
            errorTypes || (errorTypes = Objectfreeze({
                CancellationError: CancellationError,
                TimeoutError: TimeoutError,
                OperationalError: OperationalError,
                RejectionError: OperationalError,
                AggregateError: AggregateError
            }), es5.defineProperty(Error, "__BluebirdErrorTypes__", {
                value: errorTypes,
                writable: !1,
                enumerable: !1,
                configurable: !1
            })), module.exports = {
                Error: Error,
                TypeError: _TypeError,
                RangeError: _RangeError,
                CancellationError: errorTypes.CancellationError,
                OperationalError: errorTypes.OperationalError,
                TimeoutError: errorTypes.TimeoutError,
                AggregateError: errorTypes.AggregateError,
                Warning: Warning
            }
        }, {
            "./es5": 51,
            "./util": 74
        }],
        51: [function(require, module, exports) {
            var isES5 = function() {
                "use strict";
                return void 0 === this
            }();
            if (isES5) module.exports = {
                freeze: Object.freeze,
                defineProperty: Object.defineProperty,
                getDescriptor: Object.getOwnPropertyDescriptor,
                keys: Object.keys,
                names: Object.getOwnPropertyNames,
                getPrototypeOf: Object.getPrototypeOf,
                isArray: Array.isArray,
                isES5: isES5,
                propertyIsWritable: function(obj, prop) {
                    var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
                    return !(descriptor && !descriptor.writable && !descriptor.set)
                }
            };
            else {
                var has = {}.hasOwnProperty,
                    str = {}.toString,
                    proto = {}.constructor.prototype,
                    ObjectKeys = function(o) {
                        var ret = [];
                        for (var key in o) has.call(o, key) && ret.push(key);
                        return ret
                    },
                    ObjectGetDescriptor = function(o, key) {
                        return {
                            value: o[key]
                        }
                    },
                    ObjectDefineProperty = function(o, key, desc) {
                        return o[key] = desc.value, o
                    },
                    ObjectFreeze = function(obj) {
                        return obj
                    },
                    ObjectGetPrototypeOf = function(obj) {
                        try {
                            return Object(obj).constructor.prototype
                        } catch (e) {
                            return proto
                        }
                    },
                    ArrayIsArray = function(obj) {
                        try {
                            return "[object Array]" === str.call(obj)
                        } catch (e) {
                            return !1
                        }
                    };
                module.exports = {
                    isArray: ArrayIsArray,
                    keys: ObjectKeys,
                    names: ObjectKeys,
                    defineProperty: ObjectDefineProperty,
                    getDescriptor: ObjectGetDescriptor,
                    freeze: ObjectFreeze,
                    getPrototypeOf: ObjectGetPrototypeOf,
                    isES5: isES5,
                    propertyIsWritable: function() {
                        return !0
                    }
                }
            }
        }, {}],
        52: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL) {
                var PromiseMap = Promise.map;
                Promise.prototype.filter = function(fn, options) {
                    return PromiseMap(this, fn, options, INTERNAL)
                }, Promise.filter = function(promises, fn, options) {
                    return PromiseMap(promises, fn, options, INTERNAL)
                }
            }
        }, {}],
        53: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, tryConvertToPromise) {
                function PassThroughHandlerContext(promise, type, handler) {
                    this.promise = promise, this.type = type, this.handler = handler, this.called = !1, this.cancelPromise = null
                }

                function FinallyHandlerCancelReaction(finallyHandler) {
                    this.finallyHandler = finallyHandler
                }

                function checkCancel(ctx, reason) {
                    return null != ctx.cancelPromise ? (arguments.length > 1 ? ctx.cancelPromise._reject(reason) : ctx.cancelPromise._cancel(), ctx.cancelPromise = null, !0) : !1
                }

                function succeed() {
                    return finallyHandler.call(this, this.promise._target()._settledValue())
                }

                function fail(reason) {
                    return checkCancel(this, reason) ? void 0 : (errorObj.e = reason, errorObj)
                }

                function finallyHandler(reasonOrValue) {
                    var promise = this.promise,
                        handler = this.handler;
                    if (!this.called) {
                        this.called = !0;
                        var ret = this.isFinallyHandler() ? handler.call(promise._boundValue()) : handler.call(promise._boundValue(), reasonOrValue);
                        if (void 0 !== ret) {
                            promise._setReturnedNonUndefined();
                            var maybePromise = tryConvertToPromise(ret, promise);
                            if (maybePromise instanceof Promise) {
                                if (null != this.cancelPromise) {
                                    if (maybePromise._isCancelled()) {
                                        var reason = new CancellationError("late cancellation observer");
                                        return promise._attachExtraTrace(reason), errorObj.e = reason, errorObj
                                    }
                                    maybePromise.isPending() && maybePromise._attachCancellationCallback(new FinallyHandlerCancelReaction(this))
                                }
                                return maybePromise._then(succeed, fail, void 0, this, void 0)
                            }
                        }
                    }
                    return promise.isRejected() ? (checkCancel(this), errorObj.e = reasonOrValue, errorObj) : (checkCancel(this), reasonOrValue)
                }
                var util = require("./util"),
                    CancellationError = Promise.CancellationError,
                    errorObj = util.errorObj;
                return PassThroughHandlerContext.prototype.isFinallyHandler = function() {
                    return 0 === this.type
                }, FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
                    checkCancel(this.finallyHandler)
                }, Promise.prototype._passThrough = function(handler, type, success, fail) {
                    return "function" != typeof handler ? this.then() : this._then(success, fail, void 0, new PassThroughHandlerContext(this, type, handler), void 0)
                }, Promise.prototype.lastly = Promise.prototype["finally"] = function(handler) {
                    return this._passThrough(handler, 0, finallyHandler, finallyHandler);
                }, Promise.prototype.tap = function(handler) {
                    return this._passThrough(handler, 1, finallyHandler)
                }, PassThroughHandlerContext
            }
        }, {
            "./util": 74
        }],
        54: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug) {
                function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
                    for (var i = 0; i < yieldHandlers.length; ++i) {
                        traceParent._pushContext();
                        var result = tryCatch(yieldHandlers[i])(value);
                        if (traceParent._popContext(), result === errorObj) {
                            traceParent._pushContext();
                            var ret = Promise.reject(errorObj.e);
                            return traceParent._popContext(), ret
                        }
                        var maybePromise = tryConvertToPromise(result, traceParent);
                        if (maybePromise instanceof Promise) return maybePromise
                    }
                    return null
                }

                function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
                    if (debug.cancellation()) {
                        var internal = new Promise(INTERNAL),
                            _finallyPromise = this._finallyPromise = new Promise(INTERNAL);
                        this._promise = internal.lastly(function() {
                            return _finallyPromise
                        }), internal._captureStackTrace(), internal._setOnCancel(this)
                    } else {
                        var promise = this._promise = new Promise(INTERNAL);
                        promise._captureStackTrace()
                    }
                    this._stack = stack, this._generatorFunction = generatorFunction, this._receiver = receiver, this._generator = void 0, this._yieldHandlers = "function" == typeof yieldHandler ? [yieldHandler].concat(yieldHandlers) : yieldHandlers, this._yieldedPromise = null, this._cancellationPhase = !1
                }
                var errors = require("./errors"),
                    TypeError = errors.TypeError,
                    util = require("./util"),
                    errorObj = util.errorObj,
                    tryCatch = util.tryCatch,
                    yieldHandlers = [];
                util.inherits(PromiseSpawn, Proxyable), PromiseSpawn.prototype._isResolved = function() {
                    return null === this._promise
                }, PromiseSpawn.prototype._cleanup = function() {
                    this._promise = this._generator = null, debug.cancellation() && null !== this._finallyPromise && (this._finallyPromise._fulfill(), this._finallyPromise = null)
                }, PromiseSpawn.prototype._promiseCancelled = function() {
                    if (!this._isResolved()) {
                        var result, implementsReturn = "undefined" != typeof this._generator["return"];
                        if (implementsReturn) this._promise._pushContext(), result = tryCatch(this._generator["return"]).call(this._generator, void 0), this._promise._popContext();
                        else {
                            var reason = new Promise.CancellationError("generator .return() sentinel");
                            Promise.coroutine.returnSentinel = reason, this._promise._attachExtraTrace(reason), this._promise._pushContext(), result = tryCatch(this._generator["throw"]).call(this._generator, reason), this._promise._popContext()
                        }
                        this._cancellationPhase = !0, this._yieldedPromise = null, this._continue(result)
                    }
                }, PromiseSpawn.prototype._promiseFulfilled = function(value) {
                    this._yieldedPromise = null, this._promise._pushContext();
                    var result = tryCatch(this._generator.next).call(this._generator, value);
                    this._promise._popContext(), this._continue(result)
                }, PromiseSpawn.prototype._promiseRejected = function(reason) {
                    this._yieldedPromise = null, this._promise._attachExtraTrace(reason), this._promise._pushContext();
                    var result = tryCatch(this._generator["throw"]).call(this._generator, reason);
                    this._promise._popContext(), this._continue(result)
                }, PromiseSpawn.prototype._resultCancelled = function() {
                    if (this._yieldedPromise instanceof Promise) {
                        var promise = this._yieldedPromise;
                        this._yieldedPromise = null, promise.cancel()
                    }
                }, PromiseSpawn.prototype.promise = function() {
                    return this._promise
                }, PromiseSpawn.prototype._run = function() {
                    this._generator = this._generatorFunction.call(this._receiver), this._receiver = this._generatorFunction = void 0, this._promiseFulfilled(void 0)
                }, PromiseSpawn.prototype._continue = function(result) {
                    var promise = this._promise;
                    if (result === errorObj) return this._cleanup(), this._cancellationPhase ? promise.cancel() : promise._rejectCallback(result.e, !1);
                    var value = result.value;
                    if (result.done === !0) return this._cleanup(), this._cancellationPhase ? promise.cancel() : promise._resolveCallback(value);
                    var maybePromise = tryConvertToPromise(value, this._promise);
                    if (!(maybePromise instanceof Promise) && (maybePromise = promiseFromYieldHandler(maybePromise, this._yieldHandlers, this._promise), null === maybePromise)) return void this._promiseRejected(new TypeError("A value %s was yielded that could not be treated as a promise\n\n    See http://goo.gl/MqrFmX\n\n".replace("%s", value) + "From coroutine:\n" + this._stack.split("\n").slice(1, -7).join("\n")));
                    maybePromise = maybePromise._target();
                    var bitField = maybePromise._bitField;
                    0 === (50397184 & bitField) ? (this._yieldedPromise = maybePromise, maybePromise._proxy(this, null)) : 0 !== (33554432 & bitField) ? Promise._async.invoke(this._promiseFulfilled, this, maybePromise._value()) : 0 !== (16777216 & bitField) ? Promise._async.invoke(this._promiseRejected, this, maybePromise._reason()) : this._promiseCancelled()
                }, Promise.coroutine = function(generatorFunction, options) {
                    if ("function" != typeof generatorFunction) throw new TypeError("generatorFunction must be a function\n\n    See http://goo.gl/MqrFmX\n");
                    var yieldHandler = Object(options).yieldHandler,
                        PromiseSpawn$ = PromiseSpawn,
                        stack = (new Error).stack;
                    return function() {
                        var generator = generatorFunction.apply(this, arguments),
                            spawn = new PromiseSpawn$(void 0, void 0, yieldHandler, stack),
                            ret = spawn.promise();
                        return spawn._generator = generator, spawn._promiseFulfilled(void 0), ret
                    }
                }, Promise.coroutine.addYieldHandler = function(fn) {
                    if ("function" != typeof fn) throw new TypeError("expecting a function but got " + util.classString(fn));
                    yieldHandlers.push(fn)
                }, Promise.spawn = function(generatorFunction) {
                    if (debug.deprecated("Promise.spawn()", "Promise.coroutine()"), "function" != typeof generatorFunction) return apiRejection("generatorFunction must be a function\n\n    See http://goo.gl/MqrFmX\n");
                    var spawn = new PromiseSpawn(generatorFunction, this),
                        ret = spawn.promise();
                    return spawn._run(Promise.spawn), ret
                }
            }
        }, {
            "./errors": 50,
            "./util": 74
        }],
        55: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async, getDomain) {
                var reject, util = require("./util"),
                    canEvaluate = util.canEvaluate,
                    tryCatch = util.tryCatch,
                    errorObj = util.errorObj;
                if (canEvaluate) {
                    for (var thenCallback = function(i) {
                            return new Function("value", "holder", "                             \n            'use strict';                                                    \n            holder.pIndex = value;                                           \n            holder.checkFulfillment(this);                                   \n            ".replace(/Index/g, i))
                        }, promiseSetter = function(i) {
                            return new Function("promise", "holder", "                           \n            'use strict';                                                    \n            holder.pIndex = promise;                                         \n            ".replace(/Index/g, i))
                        }, generateHolderClass = function(total) {
                            for (var props = new Array(total), i = 0; i < props.length; ++i) props[i] = "this.p" + (i + 1);
                            var assignment = props.join(" = ") + " = null;",
                                cancellationCode = "var promise;\n" + props.map(function(prop) {
                                    return "                                                         \n                promise = " + prop + ";                                      \n                if (promise instanceof Promise) {                            \n                    promise.cancel();                                        \n                }                                                            \n            "
                                }).join("\n"),
                                passedArguments = props.join(", "),
                                name = "Holder$" + total,
                                code = "return function(tryCatch, errorObj, Promise, async) {    \n            'use strict';                                                    \n            function [TheName](fn) {                                         \n                [TheProperties]                                              \n                this.fn = fn;                                                \n                this.asyncNeeded = true;                                     \n                this.now = 0;                                                \n            }                                                                \n                                                                             \n            [TheName].prototype._callFunction = function(promise) {          \n                promise._pushContext();                                      \n                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n                promise._popContext();                                       \n                if (ret === errorObj) {                                      \n                    promise._rejectCallback(ret.e, false);                   \n                } else {                                                     \n                    promise._resolveCallback(ret);                           \n                }                                                            \n            };                                                               \n                                                                             \n            [TheName].prototype.checkFulfillment = function(promise) {       \n                var now = ++this.now;                                        \n                if (now === [TheTotal]) {                                    \n                    if (this.asyncNeeded) {                                  \n                        async.invoke(this._callFunction, this, promise);     \n                    } else {                                                 \n                        this._callFunction(promise);                         \n                    }                                                        \n                                                                             \n                }                                                            \n            };                                                               \n                                                                             \n            [TheName].prototype._resultCancelled = function() {              \n                [CancellationCode]                                           \n            };                                                               \n                                                                             \n            return [TheName];                                                \n        }(tryCatch, errorObj, Promise, async);                               \n        ";
                            return code = code.replace(/\[TheName\]/g, name).replace(/\[TheTotal\]/g, total).replace(/\[ThePassedArguments\]/g, passedArguments).replace(/\[TheProperties\]/g, assignment).replace(/\[CancellationCode\]/g, cancellationCode), new Function("tryCatch", "errorObj", "Promise", "async", code)(tryCatch, errorObj, Promise, async)
                        }, holderClasses = [], thenCallbacks = [], promiseSetters = [], i = 0; 8 > i; ++i) holderClasses.push(generateHolderClass(i + 1)), thenCallbacks.push(thenCallback(i + 1)), promiseSetters.push(promiseSetter(i + 1));
                    reject = function(reason) {
                        this._reject(reason)
                    }
                }
                Promise.join = function() {
                    var fn, last = arguments.length - 1;
                    if (last > 0 && "function" == typeof arguments[last] && (fn = arguments[last], 8 >= last && canEvaluate)) {
                        var ret = new Promise(INTERNAL);
                        ret._captureStackTrace();
                        for (var HolderClass = holderClasses[last - 1], holder = new HolderClass(fn), callbacks = thenCallbacks, i = 0; last > i; ++i) {
                            var maybePromise = tryConvertToPromise(arguments[i], ret);
                            if (maybePromise instanceof Promise) {
                                maybePromise = maybePromise._target();
                                var bitField = maybePromise._bitField;
                                0 === (50397184 & bitField) ? (maybePromise._then(callbacks[i], reject, void 0, ret, holder), promiseSetters[i](maybePromise, holder), holder.asyncNeeded = !1) : 0 !== (33554432 & bitField) ? callbacks[i].call(ret, maybePromise._value(), holder) : 0 !== (16777216 & bitField) ? ret._reject(maybePromise._reason()) : ret._cancel()
                            } else callbacks[i].call(ret, maybePromise, holder)
                        }
                        if (!ret._isFateSealed()) {
                            if (holder.asyncNeeded) {
                                var domain = getDomain();
                                null !== domain && (holder.fn = util.domainBind(domain, holder.fn))
                            }
                            ret._setAsyncGuaranteed(), ret._setOnCancel(holder)
                        }
                        return ret
                    }
                    for (var $_len = arguments.length, args = new Array($_len), $_i = 0; $_len > $_i; ++$_i) args[$_i] = arguments[$_i];
                    fn && args.pop();
                    var ret = new PromiseArray(args).promise();
                    return void 0 !== fn ? ret.spread(fn) : ret
                }
            }
        }, {
            "./util": 74
        }],
        56: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug) {
                function MappingPromiseArray(promises, fn, limit, _filter) {
                    this.constructor$(promises), this._promise._captureStackTrace();
                    var domain = getDomain();
                    this._callback = null === domain ? fn : util.domainBind(domain, fn), this._preservedValues = _filter === INTERNAL ? new Array(this.length()) : null, this._limit = limit, this._inFlight = 0, this._queue = [], async.invoke(this._asyncInit, this, void 0)
                }

                function map(promises, fn, options, _filter) {
                    if ("function" != typeof fn) return apiRejection("expecting a function but got " + util.classString(fn));
                    var limit = 0;
                    if (void 0 !== options) {
                        if ("object" != typeof options || null === options) return Promise.reject(new TypeError("options argument must be an object but it is " + util.classString(options)));
                        if ("number" != typeof options.concurrency) return Promise.reject(new TypeError("'concurrency' must be a number but it is " + util.classString(options.concurrency)));
                        limit = options.concurrency
                    }
                    return limit = "number" == typeof limit && isFinite(limit) && limit >= 1 ? limit : 0, new MappingPromiseArray(promises, fn, limit, _filter).promise()
                }
                var getDomain = Promise._getDomain,
                    util = require("./util"),
                    tryCatch = util.tryCatch,
                    errorObj = util.errorObj,
                    async = Promise._async;
                util.inherits(MappingPromiseArray, PromiseArray), MappingPromiseArray.prototype._asyncInit = function() {
                    this._init$(void 0, -2)
                }, MappingPromiseArray.prototype._init = function() {}, MappingPromiseArray.prototype._promiseFulfilled = function(value, index) {
                    var values = this._values,
                        length = this.length(),
                        preservedValues = this._preservedValues,
                        limit = this._limit;
                    if (0 > index) {
                        if (index = -1 * index - 1, values[index] = value, limit >= 1 && (this._inFlight--, this._drainQueue(), this._isResolved())) return !0
                    } else {
                        if (limit >= 1 && this._inFlight >= limit) return values[index] = value, this._queue.push(index), !1;
                        null !== preservedValues && (preservedValues[index] = value);
                        var promise = this._promise,
                            callback = this._callback,
                            receiver = promise._boundValue();
                        promise._pushContext();
                        var ret = tryCatch(callback).call(receiver, value, index, length),
                            promiseCreated = promise._popContext();
                        if (debug.checkForgottenReturns(ret, promiseCreated, null !== preservedValues ? "Promise.filter" : "Promise.map", promise), ret === errorObj) return this._reject(ret.e), !0;
                        var maybePromise = tryConvertToPromise(ret, this._promise);
                        if (maybePromise instanceof Promise) {
                            maybePromise = maybePromise._target();
                            var bitField = maybePromise._bitField;
                            if (0 === (50397184 & bitField)) return limit >= 1 && this._inFlight++, values[index] = maybePromise, maybePromise._proxy(this, -1 * (index + 1)), !1;
                            if (0 === (33554432 & bitField)) return 0 !== (16777216 & bitField) ? (this._reject(maybePromise._reason()), !0) : (this._cancel(), !0);
                            ret = maybePromise._value()
                        }
                        values[index] = ret
                    }
                    var totalResolved = ++this._totalResolved;
                    return totalResolved >= length ? (null !== preservedValues ? this._filter(values, preservedValues) : this._resolve(values), !0) : !1
                }, MappingPromiseArray.prototype._drainQueue = function() {
                    for (var queue = this._queue, limit = this._limit, values = this._values; queue.length > 0 && this._inFlight < limit;) {
                        if (this._isResolved()) return;
                        var index = queue.pop();
                        this._promiseFulfilled(values[index], index)
                    }
                }, MappingPromiseArray.prototype._filter = function(booleans, values) {
                    for (var len = values.length, ret = new Array(len), j = 0, i = 0; len > i; ++i) booleans[i] && (ret[j++] = values[i]);
                    ret.length = j, this._resolve(ret)
                }, MappingPromiseArray.prototype.preservedValues = function() {
                    return this._preservedValues
                }, Promise.prototype.map = function(fn, options) {
                    return map(this, fn, options, null)
                }, Promise.map = function(promises, fn, options, _filter) {
                    return map(promises, fn, options, _filter)
                }
            }
        }, {
            "./util": 74
        }],
        57: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
                var util = require("./util"),
                    tryCatch = util.tryCatch;
                Promise.method = function(fn) {
                    if ("function" != typeof fn) throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
                    return function() {
                        var ret = new Promise(INTERNAL);
                        ret._captureStackTrace(), ret._pushContext();
                        var value = tryCatch(fn).apply(this, arguments),
                            promiseCreated = ret._popContext();
                        return debug.checkForgottenReturns(value, promiseCreated, "Promise.method", ret), ret._resolveFromSyncValue(value), ret
                    }
                }, Promise.attempt = Promise["try"] = function(fn) {
                    if ("function" != typeof fn) return apiRejection("expecting a function but got " + util.classString(fn));
                    var ret = new Promise(INTERNAL);
                    ret._captureStackTrace(), ret._pushContext();
                    var value;
                    if (arguments.length > 1) {
                        debug.deprecated("calling Promise.try with more than 1 argument");
                        var arg = arguments[1],
                            ctx = arguments[2];
                        value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg) : tryCatch(fn).call(ctx, arg)
                    } else value = tryCatch(fn)();
                    var promiseCreated = ret._popContext();
                    return debug.checkForgottenReturns(value, promiseCreated, "Promise.try", ret), ret._resolveFromSyncValue(value), ret
                }, Promise.prototype._resolveFromSyncValue = function(value) {
                    value === util.errorObj ? this._rejectCallback(value.e, !1) : this._resolveCallback(value, !0)
                }
            }
        }, {
            "./util": 74
        }],
        58: [function(require, module, exports) {
            "use strict";

            function isUntypedError(obj) {
                return obj instanceof Error && es5.getPrototypeOf(obj) === Error.prototype
            }

            function wrapAsOperationalError(obj) {
                var ret;
                if (isUntypedError(obj)) {
                    ret = new OperationalError(obj), ret.name = obj.name, ret.message = obj.message, ret.stack = obj.stack;
                    for (var keys = es5.keys(obj), i = 0; i < keys.length; ++i) {
                        var key = keys[i];
                        rErrorKey.test(key) || (ret[key] = obj[key])
                    }
                    return ret
                }
                return util.markAsOriginatingFromRejection(obj), obj
            }

            function nodebackForPromise(promise, multiArgs) {
                return function(err, value) {
                    if (null !== promise) {
                        if (err) {
                            var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
                            promise._attachExtraTrace(wrapped), promise._reject(wrapped)
                        } else if (multiArgs) {
                            for (var $_len = arguments.length, args = new Array(Math.max($_len - 1, 0)), $_i = 1; $_len > $_i; ++$_i) args[$_i - 1] = arguments[$_i];
                            promise._fulfill(args)
                        } else promise._fulfill(value);
                        promise = null
                    }
                }
            }
            var util = require("./util"),
                maybeWrapAsError = util.maybeWrapAsError,
                errors = require("./errors"),
                OperationalError = errors.OperationalError,
                es5 = require("./es5"),
                rErrorKey = /^(?:name|message|stack|cause)$/;
            module.exports = nodebackForPromise
        }, {
            "./errors": 50,
            "./es5": 51,
            "./util": 74
        }],
        59: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise) {
                function spreadAdapter(val, nodeback) {
                    var promise = this;
                    if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
                    var ret = tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
                    ret === errorObj && async.throwLater(ret.e)
                }

                function successAdapter(val, nodeback) {
                    var promise = this,
                        receiver = promise._boundValue(),
                        ret = void 0 === val ? tryCatch(nodeback).call(receiver, null) : tryCatch(nodeback).call(receiver, null, val);
                    ret === errorObj && async.throwLater(ret.e)
                }

                function errorAdapter(reason, nodeback) {
                    var promise = this;
                    if (!reason) {
                        var newReason = new Error(reason + "");
                        newReason.cause = reason, reason = newReason
                    }
                    var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
                    ret === errorObj && async.throwLater(ret.e)
                }
                var util = require("./util"),
                    async = Promise._async, tryCatch = util.tryCatch, errorObj = util.errorObj;
                Promise.prototype.asCallback = Promise.prototype.nodeify = function(nodeback, options) {
                    if ("function" == typeof nodeback) {
                        var adapter = successAdapter;
                        void 0 !== options && Object(options).spread && (adapter = spreadAdapter), this._then(adapter, errorAdapter, void 0, this, nodeback)
                    }
                    return this
                }
            }
        }, {
            "./util": 74
        }],
        60: [function(require, module, exports) {
            (function(process) {
                "use strict";
                module.exports = function() {
                    function Proxyable() {}

                    function check(self, executor) {
                        if ("function" != typeof executor) throw new TypeError("expecting a function but got " + util.classString(executor));
                        if (self.constructor !== Promise) throw new TypeError("the promise constructor cannot be invoked directly\n\n    See http://goo.gl/MqrFmX\n")
                    }

                    function Promise(executor) {
                        this._bitField = 0, this._fulfillmentHandler0 = void 0, this._rejectionHandler0 = void 0, this._promise0 = void 0, this._receiver0 = void 0, executor !== INTERNAL && (check(this, executor), this._resolveFromExecutor(executor)), this._promiseCreated(), this._fireEvent("promiseCreated", this)
                    }

                    function deferResolve(v) {
                        this.promise._resolveCallback(v)
                    }

                    function deferReject(v) {
                        this.promise._rejectCallback(v, !1)
                    }

                    function fillTypes(value) {
                        var p = new Promise(INTERNAL);
                        p._fulfillmentHandler0 = value, p._rejectionHandler0 = value, p._promise0 = value, p._receiver0 = value
                    }
                    var getDomain, makeSelfResolutionError = function() {
                            return new TypeError("circular promise resolution chain\n\n    See http://goo.gl/MqrFmX\n")
                        },
                        reflectHandler = function() {
                            return new Promise.PromiseInspection(this._target())
                        },
                        apiRejection = function(msg) {
                            return Promise.reject(new TypeError(msg))
                        },
                        UNDEFINED_BINDING = {},
                        util = require("./util");
                    getDomain = util.isNode ? function() {
                        var ret = process.domain;
                        return void 0 === ret && (ret = null), ret
                    } : function() {
                        return null
                    }, util.notEnumerableProp(Promise, "_getDomain", getDomain);
                    var es5 = require("./es5"),
                        Async = require("./async"),
                        async = new Async;
                    es5.defineProperty(Promise, "_async", {
                        value: async
                    });
                    var errors = require("./errors"),
                        TypeError = Promise.TypeError = errors.TypeError;
                    Promise.RangeError = errors.RangeError;
                    var CancellationError = Promise.CancellationError = errors.CancellationError;
                    Promise.TimeoutError = errors.TimeoutError, Promise.OperationalError = errors.OperationalError, Promise.RejectionError = errors.OperationalError, Promise.AggregateError = errors.AggregateError;
                    var INTERNAL = function() {},
                        APPLY = {},
                        NEXT_FILTER = {},
                        tryConvertToPromise = require("./thenables")(Promise, INTERNAL),
                        PromiseArray = require("./promise_array")(Promise, INTERNAL, tryConvertToPromise, apiRejection, Proxyable),
                        Context = require("./context")(Promise),
                        createContext = Context.create,
                        debug = require("./debuggability")(Promise, Context),
                        PassThroughHandlerContext = (debug.CapturedTrace, require("./finally")(Promise, tryConvertToPromise)),
                        catchFilter = require("./catch_filter")(NEXT_FILTER),
                        nodebackForPromise = require("./nodeback"),
                        errorObj = util.errorObj,
                        tryCatch = util.tryCatch;
                    return Promise.prototype.toString = function() {
                        return "[object Promise]"
                    }, Promise.prototype.caught = Promise.prototype["catch"] = function(fn) {
                        var len = arguments.length;
                        if (len > 1) {
                            var i, catchInstances = new Array(len - 1),
                                j = 0;
                            for (i = 0; len - 1 > i; ++i) {
                                var item = arguments[i];
                                if (!util.isObject(item)) return apiRejection("expecting an object but got A catch statement predicate " + util.classString(item));
                                catchInstances[j++] = item
                            }
                            return catchInstances.length = j, fn = arguments[i], this.then(void 0, catchFilter(catchInstances, fn, this))
                        }
                        return this.then(void 0, fn)
                    }, Promise.prototype.reflect = function() {
                        return this._then(reflectHandler, reflectHandler, void 0, this, void 0)
                    }, Promise.prototype.then = function(didFulfill, didReject) {
                        if (debug.warnings() && arguments.length > 0 && "function" != typeof didFulfill && "function" != typeof didReject) {
                            var msg = ".then() only accepts functions but was passed: " + util.classString(didFulfill);
                            arguments.length > 1 && (msg += ", " + util.classString(didReject)), this._warn(msg)
                        }
                        return this._then(didFulfill, didReject, void 0, void 0, void 0)
                    }, Promise.prototype.done = function(didFulfill, didReject) {
                        var promise = this._then(didFulfill, didReject, void 0, void 0, void 0);
                        promise._setIsFinal()
                    }, Promise.prototype.spread = function(fn) {
                        return "function" != typeof fn ? apiRejection("expecting a function but got " + util.classString(fn)) : this.all()._then(fn, void 0, void 0, APPLY, void 0)
                    }, Promise.prototype.toJSON = function() {
                        var ret = {
                            isFulfilled: !1,
                            isRejected: !1,
                            fulfillmentValue: void 0,
                            rejectionReason: void 0
                        };
                        return this.isFulfilled() ? (ret.fulfillmentValue = this.value(), ret.isFulfilled = !0) : this.isRejected() && (ret.rejectionReason = this.reason(), ret.isRejected = !0), ret
                    }, Promise.prototype.all = function() {
                        return arguments.length > 0 && this._warn(".all() was passed arguments but it does not take any"), new PromiseArray(this).promise()
                    }, Promise.prototype.error = function(fn) {
                        return this.caught(util.originatesFromRejection, fn)
                    }, Promise.getNewLibraryCopy = module.exports, Promise.is = function(val) {
                        return val instanceof Promise
                    }, Promise.fromNode = Promise.fromCallback = function(fn) {
                        var ret = new Promise(INTERNAL);
                        ret._captureStackTrace();
                        var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs : !1,
                            result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
                        return result === errorObj && ret._rejectCallback(result.e, !0), ret._isFateSealed() || ret._setAsyncGuaranteed(), ret
                    }, Promise.all = function(promises) {
                        return new PromiseArray(promises).promise()
                    }, Promise.cast = function(obj) {
                        var ret = tryConvertToPromise(obj);
                        return ret instanceof Promise || (ret = new Promise(INTERNAL), ret._captureStackTrace(), ret._setFulfilled(), ret._rejectionHandler0 = obj), ret
                    }, Promise.resolve = Promise.fulfilled = Promise.cast, Promise.reject = Promise.rejected = function(reason) {
                        var ret = new Promise(INTERNAL);
                        return ret._captureStackTrace(), ret._rejectCallback(reason, !0), ret
                    }, Promise.setScheduler = function(fn) {
                        if ("function" != typeof fn) throw new TypeError("expecting a function but got " + util.classString(fn));
                        return async.setScheduler(fn)
                    }, Promise.prototype._then = function(didFulfill, didReject, _, receiver, internalData) {
                        var haveInternalData = void 0 !== internalData,
                            promise = haveInternalData ? internalData : new Promise(INTERNAL),
                            target = this._target(),
                            bitField = target._bitField;
                        haveInternalData || (promise._propagateFrom(this, 3), promise._captureStackTrace(), void 0 === receiver && 0 !== (2097152 & this._bitField) && (receiver = 0 !== (50397184 & bitField) ? this._boundValue() : target === this ? void 0 : this._boundTo), this._fireEvent("promiseChained", this, promise));
                        var domain = getDomain();
                        if (0 !== (50397184 & bitField)) {
                            var handler, value, settler = target._settlePromiseCtx;
                            0 !== (33554432 & bitField) ? (value = target._rejectionHandler0, handler = didFulfill) : 0 !== (16777216 & bitField) ? (value = target._fulfillmentHandler0, handler = didReject, target._unsetRejectionIsUnhandled()) : (settler = target._settlePromiseLateCancellationObserver, value = new CancellationError("late cancellation observer"), target._attachExtraTrace(value), handler = didReject), async.invoke(settler, target, {
                                handler: null === domain ? handler : "function" == typeof handler && util.domainBind(domain, handler),
                                promise: promise,
                                receiver: receiver,
                                value: value
                            })
                        } else target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
                        return promise
                    }, Promise.prototype._length = function() {
                        return 65535 & this._bitField
                    }, Promise.prototype._isFateSealed = function() {
                        return 0 !== (117506048 & this._bitField)
                    }, Promise.prototype._isFollowing = function() {
                        return 67108864 === (67108864 & this._bitField)
                    }, Promise.prototype._setLength = function(len) {
                        this._bitField = -65536 & this._bitField | 65535 & len
                    }, Promise.prototype._setFulfilled = function() {
                        this._bitField = 33554432 | this._bitField, this._fireEvent("promiseFulfilled", this)
                    }, Promise.prototype._setRejected = function() {
                        this._bitField = 16777216 | this._bitField, this._fireEvent("promiseRejected", this)
                    }, Promise.prototype._setFollowing = function() {
                        this._bitField = 67108864 | this._bitField, this._fireEvent("promiseResolved", this)
                    }, Promise.prototype._setIsFinal = function() {
                        this._bitField = 4194304 | this._bitField
                    }, Promise.prototype._isFinal = function() {
                        return (4194304 & this._bitField) > 0
                    }, Promise.prototype._unsetCancelled = function() {
                        this._bitField = -65537 & this._bitField
                    }, Promise.prototype._setCancelled = function() {
                        this._bitField = 65536 | this._bitField, this._fireEvent("promiseCancelled", this)
                    }, Promise.prototype._setWillBeCancelled = function() {
                        this._bitField = 8388608 | this._bitField
                    }, Promise.prototype._setAsyncGuaranteed = function() {
                        async.hasCustomScheduler() || (this._bitField = 134217728 | this._bitField)
                    }, Promise.prototype._receiverAt = function(index) {
                        var ret = 0 === index ? this._receiver0 : this[4 * index - 4 + 3];
                        return ret === UNDEFINED_BINDING ? void 0 : void 0 === ret && this._isBound() ? this._boundValue() : ret
                    }, Promise.prototype._promiseAt = function(index) {
                        return this[4 * index - 4 + 2]
                    }, Promise.prototype._fulfillmentHandlerAt = function(index) {
                        return this[4 * index - 4 + 0]
                    }, Promise.prototype._rejectionHandlerAt = function(index) {
                        return this[4 * index - 4 + 1]
                    }, Promise.prototype._boundValue = function() {}, Promise.prototype._migrateCallback0 = function(follower) {
                        var fulfill = (follower._bitField, follower._fulfillmentHandler0),
                            reject = follower._rejectionHandler0,
                            promise = follower._promise0,
                            receiver = follower._receiverAt(0);
                        void 0 === receiver && (receiver = UNDEFINED_BINDING), this._addCallbacks(fulfill, reject, promise, receiver, null)
                    }, Promise.prototype._migrateCallbackAt = function(follower, index) {
                        var fulfill = follower._fulfillmentHandlerAt(index),
                            reject = follower._rejectionHandlerAt(index),
                            promise = follower._promiseAt(index),
                            receiver = follower._receiverAt(index);
                        void 0 === receiver && (receiver = UNDEFINED_BINDING), this._addCallbacks(fulfill, reject, promise, receiver, null)
                    }, Promise.prototype._addCallbacks = function(fulfill, reject, promise, receiver, domain) {
                        var index = this._length();
                        if (index >= 65531 && (index = 0, this._setLength(0)), 0 === index) this._promise0 = promise, this._receiver0 = receiver, "function" == typeof fulfill && (this._fulfillmentHandler0 = null === domain ? fulfill : util.domainBind(domain, fulfill)), "function" == typeof reject && (this._rejectionHandler0 = null === domain ? reject : util.domainBind(domain, reject));
                        else {
                            var base = 4 * index - 4;
                            this[base + 2] = promise, this[base + 3] = receiver, "function" == typeof fulfill && (this[base + 0] = null === domain ? fulfill : util.domainBind(domain, fulfill)), "function" == typeof reject && (this[base + 1] = null === domain ? reject : util.domainBind(domain, reject))
                        }
                        return this._setLength(index + 1), index
                    }, Promise.prototype._proxy = function(proxyable, arg) {
                        this._addCallbacks(void 0, void 0, arg, proxyable, null)
                    }, Promise.prototype._resolveCallback = function(value, shouldBind) {
                        if (0 === (117506048 & this._bitField)) {
                            if (value === this) return this._rejectCallback(makeSelfResolutionError(), !1);
                            var maybePromise = tryConvertToPromise(value, this);
                            if (!(maybePromise instanceof Promise)) return this._fulfill(value);
                            shouldBind && this._propagateFrom(maybePromise, 2);
                            var promise = maybePromise._target();
                            if (promise === this) return void this._reject(makeSelfResolutionError());
                            var bitField = promise._bitField;
                            if (0 === (50397184 & bitField)) {
                                var len = this._length();
                                len > 0 && promise._migrateCallback0(this);
                                for (var i = 1; len > i; ++i) promise._migrateCallbackAt(this, i);
                                this._setFollowing(), this._setLength(0), this._setFollowee(promise)
                            } else if (0 !== (33554432 & bitField)) this._fulfill(promise._value());
                            else if (0 !== (16777216 & bitField)) this._reject(promise._reason());
                            else {
                                var reason = new CancellationError("late cancellation observer");
                                promise._attachExtraTrace(reason), this._reject(reason)
                            }
                        }
                    }, Promise.prototype._rejectCallback = function(reason, synchronous, ignoreNonErrorWarnings) {
                        var trace = util.ensureErrorObject(reason),
                            hasStack = trace === reason;
                        if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
                            var message = "a promise was rejected with a non-error: " + util.classString(reason);
                            this._warn(message, !0)
                        }
                        this._attachExtraTrace(trace, synchronous ? hasStack : !1), this._reject(reason)
                    }, Promise.prototype._resolveFromExecutor = function(executor) {
                        var promise = this;
                        this._captureStackTrace(), this._pushContext();
                        var synchronous = !0,
                            r = this._execute(executor, function(value) {
                                promise._resolveCallback(value)
                            }, function(reason) {
                                promise._rejectCallback(reason, synchronous)
                            });
                        synchronous = !1, this._popContext(), void 0 !== r && promise._rejectCallback(r, !0)
                    }, Promise.prototype._settlePromiseFromHandler = function(handler, receiver, value, promise) {
                        var bitField = promise._bitField;
                        if (0 === (65536 & bitField)) {
                            promise._pushContext();
                            var x;
                            receiver === APPLY ? value && "number" == typeof value.length ? x = tryCatch(handler).apply(this._boundValue(), value) : (x = errorObj, x.e = new TypeError("cannot .spread() a non-array: " + util.classString(value))) : x = tryCatch(handler).call(receiver, value);
                            var promiseCreated = promise._popContext();
                            bitField = promise._bitField, 0 === (65536 & bitField) && (x === NEXT_FILTER ? promise._reject(value) : x === errorObj ? promise._rejectCallback(x.e, !1) : (debug.checkForgottenReturns(x, promiseCreated, "", promise, this), promise._resolveCallback(x)))
                        }
                    }, Promise.prototype._target = function() {
                        for (var ret = this; ret._isFollowing();) ret = ret._followee();
                        return ret
                    }, Promise.prototype._followee = function() {
                        return this._rejectionHandler0
                    }, Promise.prototype._setFollowee = function(promise) {
                        this._rejectionHandler0 = promise
                    }, Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
                        var isPromise = promise instanceof Promise,
                            bitField = this._bitField,
                            asyncGuaranteed = 0 !== (134217728 & bitField);
                        0 !== (65536 & bitField) ? (isPromise && promise._invokeInternalOnCancel(),
                            receiver instanceof PassThroughHandlerContext && receiver.isFinallyHandler() ? (receiver.cancelPromise = promise, tryCatch(handler).call(receiver, value) === errorObj && promise._reject(errorObj.e)) : handler === reflectHandler ? promise._fulfill(reflectHandler.call(receiver)) : receiver instanceof Proxyable ? receiver._promiseCancelled(promise) : isPromise || promise instanceof PromiseArray ? promise._cancel() : receiver.cancel()) : "function" == typeof handler ? isPromise ? (asyncGuaranteed && promise._setAsyncGuaranteed(), this._settlePromiseFromHandler(handler, receiver, value, promise)) : handler.call(receiver, value, promise) : receiver instanceof Proxyable ? receiver._isResolved() || (0 !== (33554432 & bitField) ? receiver._promiseFulfilled(value, promise) : receiver._promiseRejected(value, promise)) : isPromise && (asyncGuaranteed && promise._setAsyncGuaranteed(), 0 !== (33554432 & bitField) ? promise._fulfill(value) : promise._reject(value))
                    }, Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
                        var handler = ctx.handler,
                            promise = ctx.promise,
                            receiver = ctx.receiver,
                            value = ctx.value;
                        "function" == typeof handler ? promise instanceof Promise ? this._settlePromiseFromHandler(handler, receiver, value, promise) : handler.call(receiver, value, promise) : promise instanceof Promise && promise._reject(value)
                    }, Promise.prototype._settlePromiseCtx = function(ctx) {
                        this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value)
                    }, Promise.prototype._settlePromise0 = function(handler, value, bitField) {
                        var promise = this._promise0,
                            receiver = this._receiverAt(0);
                        this._promise0 = void 0, this._receiver0 = void 0, this._settlePromise(promise, handler, receiver, value)
                    }, Promise.prototype._clearCallbackDataAtIndex = function(index) {
                        var base = 4 * index - 4;
                        this[base + 2] = this[base + 3] = this[base + 0] = this[base + 1] = void 0
                    }, Promise.prototype._fulfill = function(value) {
                        var bitField = this._bitField;
                        if (!((117506048 & bitField) >>> 16)) {
                            if (value === this) {
                                var err = makeSelfResolutionError();
                                return this._attachExtraTrace(err), this._reject(err)
                            }
                            this._setFulfilled(), this._rejectionHandler0 = value, (65535 & bitField) > 0 && (0 !== (134217728 & bitField) ? this._settlePromises() : async.settlePromises(this))
                        }
                    }, Promise.prototype._reject = function(reason) {
                        var bitField = this._bitField;
                        if (!((117506048 & bitField) >>> 16)) return this._setRejected(), this._fulfillmentHandler0 = reason, this._isFinal() ? async.fatalError(reason, util.isNode): void((65535 & bitField) > 0 ? async.settlePromises(this): this._ensurePossibleRejectionHandled())
                    }, Promise.prototype._fulfillPromises = function(len, value) {
                        for (var i = 1; len > i; i++) {
                            var handler = this._fulfillmentHandlerAt(i),
                                promise = this._promiseAt(i),
                                receiver = this._receiverAt(i);
                            this._clearCallbackDataAtIndex(i), this._settlePromise(promise, handler, receiver, value)
                        }
                    }, Promise.prototype._rejectPromises = function(len, reason) {
                        for (var i = 1; len > i; i++) {
                            var handler = this._rejectionHandlerAt(i),
                                promise = this._promiseAt(i),
                                receiver = this._receiverAt(i);
                            this._clearCallbackDataAtIndex(i), this._settlePromise(promise, handler, receiver, reason)
                        }
                    }, Promise.prototype._settlePromises = function() {
                        var bitField = this._bitField,
                            len = 65535 & bitField;
                        if (len > 0) {
                            if (0 !== (16842752 & bitField)) {
                                var reason = this._fulfillmentHandler0;
                                this._settlePromise0(this._rejectionHandler0, reason, bitField), this._rejectPromises(len, reason)
                            } else {
                                var value = this._rejectionHandler0;
                                this._settlePromise0(this._fulfillmentHandler0, value, bitField), this._fulfillPromises(len, value)
                            }
                            this._setLength(0)
                        }
                        this._clearCancellationData()
                    }, Promise.prototype._settledValue = function() {
                        var bitField = this._bitField;
                        return 0 !== (33554432 & bitField) ? this._rejectionHandler0 : 0 !== (16777216 & bitField) ? this._fulfillmentHandler0 : void 0
                    }, Promise.defer = Promise.pending = function() {
                        debug.deprecated("Promise.defer", "new Promise");
                        var promise = new Promise(INTERNAL);
                        return {
                            promise: promise,
                            resolve: deferResolve,
                            reject: deferReject
                        }
                    }, util.notEnumerableProp(Promise, "_makeSelfResolutionError", makeSelfResolutionError), require("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug), require("./bind")(Promise, INTERNAL, tryConvertToPromise, debug), require("./cancel")(Promise, PromiseArray, apiRejection, debug), require("./direct_resolve")(Promise), require("./synchronous_inspection")(Promise), require("./join")(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async, getDomain), Promise.Promise = Promise, Promise.version = "3.4.7", require("./map.js")(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug), require("./call_get.js")(Promise), require("./using.js")(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug), require("./timers.js")(Promise, INTERNAL, debug), require("./generators.js")(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug), require("./nodeify.js")(Promise), require("./promisify.js")(Promise, INTERNAL), require("./props.js")(Promise, PromiseArray, tryConvertToPromise, apiRejection), require("./race.js")(Promise, INTERNAL, tryConvertToPromise, apiRejection), require("./reduce.js")(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug), require("./settle.js")(Promise, PromiseArray, debug), require("./some.js")(Promise, PromiseArray, apiRejection), require("./filter.js")(Promise, INTERNAL), require("./each.js")(Promise, INTERNAL), require("./any.js")(Promise), util.toFastProperties(Promise), util.toFastProperties(Promise.prototype), fillTypes({
                        a: 1
                    }), fillTypes({
                        b: 2
                    }), fillTypes({
                        c: 3
                    }), fillTypes(1), fillTypes(function() {}), fillTypes(void 0), fillTypes(!1), fillTypes(new Promise(INTERNAL)), debug.setBounds(Async.firstLineError, util.lastLineError), Promise
                }
            }).call(this, require("_process"))
        }, {
            "./any.js": 40,
            "./async": 41,
            "./bind": 42,
            "./call_get.js": 43,
            "./cancel": 44,
            "./catch_filter": 45,
            "./context": 46,
            "./debuggability": 47,
            "./direct_resolve": 48,
            "./each.js": 49,
            "./errors": 50,
            "./es5": 51,
            "./filter.js": 52,
            "./finally": 53,
            "./generators.js": 54,
            "./join": 55,
            "./map.js": 56,
            "./method": 57,
            "./nodeback": 58,
            "./nodeify.js": 59,
            "./promise_array": 61,
            "./promisify.js": 62,
            "./props.js": 63,
            "./race.js": 65,
            "./reduce.js": 66,
            "./settle.js": 68,
            "./some.js": 69,
            "./synchronous_inspection": 70,
            "./thenables": 71,
            "./timers.js": 72,
            "./using.js": 73,
            "./util": 74,
            _process: 138
        }],
        61: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL, tryConvertToPromise, apiRejection, Proxyable) {
                function toResolutionValue(val) {
                    switch (val) {
                        case -2:
                            return [];
                        case -3:
                            return {}
                    }
                }

                function PromiseArray(values) {
                    var promise = this._promise = new Promise(INTERNAL);
                    values instanceof Promise && promise._propagateFrom(values, 3), promise._setOnCancel(this), this._values = values, this._length = 0, this._totalResolved = 0, this._init(void 0, -2)
                }
                var util = require("./util");
                util.isArray;
                return util.inherits(PromiseArray, Proxyable), PromiseArray.prototype.length = function() {
                    return this._length
                }, PromiseArray.prototype.promise = function() {
                    return this._promise
                }, PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
                    var values = tryConvertToPromise(this._values, this._promise);
                    if (values instanceof Promise) {
                        values = values._target();
                        var bitField = values._bitField;
                        if (this._values = values, 0 === (50397184 & bitField)) return this._promise._setAsyncGuaranteed(), values._then(init, this._reject, void 0, this, resolveValueIfEmpty);
                        if (0 === (33554432 & bitField)) return 0 !== (16777216 & bitField) ? this._reject(values._reason()) : this._cancel();
                        values = values._value()
                    }
                    if (values = util.asArray(values), null === values) {
                        var err = apiRejection("expecting an array or an iterable object but got " + util.classString(values)).reason();
                        return void this._promise._rejectCallback(err, !1)
                    }
                    return 0 === values.length ? void(-5 === resolveValueIfEmpty ? this._resolveEmptyArray() : this._resolve(toResolutionValue(resolveValueIfEmpty))) : void this._iterate(values)
                }, PromiseArray.prototype._iterate = function(values) {
                    var len = this.getActualLength(values.length);
                    this._length = len, this._values = this.shouldCopyValues() ? new Array(len) : this._values;
                    for (var result = this._promise, isResolved = !1, bitField = null, i = 0; len > i; ++i) {
                        var maybePromise = tryConvertToPromise(values[i], result);
                        maybePromise instanceof Promise ? (maybePromise = maybePromise._target(), bitField = maybePromise._bitField) : bitField = null, isResolved ? null !== bitField && maybePromise.suppressUnhandledRejections() : null !== bitField ? 0 === (50397184 & bitField) ? (maybePromise._proxy(this, i), this._values[i] = maybePromise) : isResolved = 0 !== (33554432 & bitField) ? this._promiseFulfilled(maybePromise._value(), i) : 0 !== (16777216 & bitField) ? this._promiseRejected(maybePromise._reason(), i) : this._promiseCancelled(i) : isResolved = this._promiseFulfilled(maybePromise, i)
                    }
                    isResolved || result._setAsyncGuaranteed()
                }, PromiseArray.prototype._isResolved = function() {
                    return null === this._values
                }, PromiseArray.prototype._resolve = function(value) {
                    this._values = null, this._promise._fulfill(value)
                }, PromiseArray.prototype._cancel = function() {
                    !this._isResolved() && this._promise._isCancellable() && (this._values = null, this._promise._cancel())
                }, PromiseArray.prototype._reject = function(reason) {
                    this._values = null, this._promise._rejectCallback(reason, !1)
                }, PromiseArray.prototype._promiseFulfilled = function(value, index) {
                    this._values[index] = value;
                    var totalResolved = ++this._totalResolved;
                    return totalResolved >= this._length ? (this._resolve(this._values), !0) : !1
                }, PromiseArray.prototype._promiseCancelled = function() {
                    return this._cancel(), !0
                }, PromiseArray.prototype._promiseRejected = function(reason) {
                    return this._totalResolved++, this._reject(reason), !0
                }, PromiseArray.prototype._resultCancelled = function() {
                    if (!this._isResolved()) {
                        var values = this._values;
                        if (this._cancel(), values instanceof Promise) values.cancel();
                        else
                            for (var i = 0; i < values.length; ++i) values[i] instanceof Promise && values[i].cancel()
                    }
                }, PromiseArray.prototype.shouldCopyValues = function() {
                    return !0
                }, PromiseArray.prototype.getActualLength = function(len) {
                    return len
                }, PromiseArray
            }
        }, {
            "./util": 74
        }],
        62: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL) {
                function propsFilter(key) {
                    return !noCopyPropsPattern.test(key)
                }

                function isPromisified(fn) {
                    try {
                        return fn.__isPromisified__ === !0
                    } catch (e) {
                        return !1
                    }
                }

                function hasPromisified(obj, key, suffix) {
                    var val = util.getDataPropertyOrDefault(obj, key + suffix, defaultPromisified);
                    return val ? isPromisified(val) : !1
                }

                function checkValid(ret, suffix, suffixRegexp) {
                    for (var i = 0; i < ret.length; i += 2) {
                        var key = ret[i];
                        if (suffixRegexp.test(key))
                            for (var keyWithoutAsyncSuffix = key.replace(suffixRegexp, ""), j = 0; j < ret.length; j += 2)
                                if (ret[j] === keyWithoutAsyncSuffix) throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\n\n    See http://goo.gl/MqrFmX\n".replace("%s", suffix))
                    }
                }

                function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
                    for (var keys = util.inheritedDataKeys(obj), ret = [], i = 0; i < keys.length; ++i) {
                        var key = keys[i],
                            value = obj[key],
                            passesDefaultFilter = filter === defaultFilter ? !0 : defaultFilter(key, value, obj);
                        "function" != typeof value || isPromisified(value) || hasPromisified(obj, key, suffix) || !filter(key, value, obj, passesDefaultFilter) || ret.push(key, value)
                    }
                    return checkValid(ret, suffix, suffixRegexp), ret
                }

                function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
                    function promisified() {
                        var _receiver = receiver;
                        receiver === THIS && (_receiver = this);
                        var promise = new Promise(INTERNAL);
                        promise._captureStackTrace();
                        var cb = "string" == typeof method && this !== defaultThis ? this[method] : callback,
                            fn = nodebackForPromise(promise, multiArgs);
                        try {
                            cb.apply(_receiver, withAppended(arguments, fn))
                        } catch (e) {
                            promise._rejectCallback(maybeWrapAsError(e), !0, !0)
                        }
                        return promise._isFateSealed() || promise._setAsyncGuaranteed(), promise
                    }
                    var defaultThis = function() {
                            return this
                        }(),
                        method = callback;
                    return "string" == typeof method && (callback = fn), util.notEnumerableProp(promisified, "__isPromisified__", !0), promisified
                }

                function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
                    for (var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$"), methods = promisifiableMethods(obj, suffix, suffixRegexp, filter), i = 0, len = methods.length; len > i; i += 2) {
                        var key = methods[i],
                            fn = methods[i + 1],
                            promisifiedKey = key + suffix;
                        if (promisifier === makeNodePromisified) obj[promisifiedKey] = makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
                        else {
                            var promisified = promisifier(fn, function() {
                                return makeNodePromisified(key, THIS, key, fn, suffix, multiArgs)
                            });
                            util.notEnumerableProp(promisified, "__isPromisified__", !0), obj[promisifiedKey] = promisified
                        }
                    }
                    return util.toFastProperties(obj), obj
                }

                function promisify(callback, receiver, multiArgs) {
                    return makeNodePromisified(callback, receiver, void 0, callback, null, multiArgs)
                }
                var makeNodePromisifiedEval, THIS = {},
                    util = require("./util"),
                    nodebackForPromise = require("./nodeback"),
                    withAppended = util.withAppended,
                    maybeWrapAsError = util.maybeWrapAsError,
                    canEvaluate = util.canEvaluate,
                    TypeError = require("./errors").TypeError,
                    defaultSuffix = "Async",
                    defaultPromisified = {
                        __isPromisified__: !0
                    },
                    noCopyProps = ["arity", "length", "name", "arguments", "caller", "callee", "prototype", "__isPromisified__"],
                    noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$"),
                    defaultFilter = function(name) {
                        return util.isIdentifier(name) && "_" !== name.charAt(0) && "constructor" !== name
                    },
                    escapeIdentRegex = function(str) {
                        return str.replace(/([$])/, "\\$")
                    },
                    switchCaseArgumentOrder = function(likelyArgumentCount) {
                        for (var ret = [likelyArgumentCount], min = Math.max(0, likelyArgumentCount - 1 - 3), i = likelyArgumentCount - 1; i >= min; --i) ret.push(i);
                        for (var i = likelyArgumentCount + 1; 3 >= i; ++i) ret.push(i);
                        return ret
                    },
                    argumentSequence = function(argumentCount) {
                        return util.filledRange(argumentCount, "_arg", "")
                    },
                    parameterDeclaration = function(parameterCount) {
                        return util.filledRange(Math.max(parameterCount, 3), "_arg", "")
                    },
                    parameterCount = function(fn) {
                        return "number" == typeof fn.length ? Math.max(Math.min(fn.length, 1024), 0) : 0
                    };
                makeNodePromisifiedEval = function(callback, receiver, originalName, fn, _, multiArgs) {
                    function generateCallForArgumentCount(count) {
                        var ret, args = argumentSequence(count).join(", "),
                            comma = count > 0 ? ", " : "";
                        return ret = shouldProxyThis ? "ret = callback.call(this, {{args}}, nodeback); break;\n" : void 0 === receiver ? "ret = callback({{args}}, nodeback); break;\n" : "ret = callback.call(receiver, {{args}}, nodeback); break;\n", ret.replace("{{args}}", args).replace(", ", comma)
                    }

                    function generateArgumentSwitchCase() {
                        for (var ret = "", i = 0; i < argumentOrder.length; ++i) ret += "case " + argumentOrder[i] + ":" + generateCallForArgumentCount(argumentOrder[i]);
                        return ret += "                                                             \n        default:                                                             \n            var args = new Array(len + 1);                                   \n            var i = 0;                                                       \n            for (var i = 0; i < len; ++i) {                                  \n               args[i] = arguments[i];                                       \n            }                                                                \n            args[i] = nodeback;                                              \n            [CodeForCall]                                                    \n            break;                                                           \n        ".replace("[CodeForCall]", shouldProxyThis ? "ret = callback.apply(this, args);\n" : "ret = callback.apply(receiver, args);\n")
                    }
                    var newParameterCount = Math.max(0, parameterCount(fn) - 1),
                        argumentOrder = switchCaseArgumentOrder(newParameterCount),
                        shouldProxyThis = "string" == typeof callback || receiver === THIS,
                        getFunctionCode = "string" == typeof callback ? "this != null ? this['" + callback + "'] : fn" : "fn",
                        body = "'use strict';                                                \n        var ret = function (Parameters) {                                    \n            'use strict';                                                    \n            var len = arguments.length;                                      \n            var promise = new Promise(INTERNAL);                             \n            promise._captureStackTrace();                                    \n            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n            var ret;                                                         \n            var callback = tryCatch([GetFunctionCode]);                      \n            switch(len) {                                                    \n                [CodeForSwitchCase]                                          \n            }                                                                \n            if (ret === errorObj) {                                          \n                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n            }                                                                \n            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n            return promise;                                                  \n        };                                                                   \n        notEnumerableProp(ret, '__isPromisified__', true);                   \n        return ret;                                                          \n    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase()).replace("[GetFunctionCode]", getFunctionCode);
                    return body = body.replace("Parameters", parameterDeclaration(newParameterCount)), new Function("Promise", "fn", "receiver", "withAppended", "maybeWrapAsError", "nodebackForPromise", "tryCatch", "errorObj", "notEnumerableProp", "INTERNAL", body)(Promise, fn, receiver, withAppended, maybeWrapAsError, nodebackForPromise, util.tryCatch, util.errorObj, util.notEnumerableProp, INTERNAL)
                };
                var makeNodePromisified = canEvaluate ? makeNodePromisifiedEval : makeNodePromisifiedClosure;
                Promise.promisify = function(fn, options) {
                    if ("function" != typeof fn) throw new TypeError("expecting a function but got " + util.classString(fn));
                    if (isPromisified(fn)) return fn;
                    options = Object(options);
                    var receiver = void 0 === options.context ? THIS : options.context,
                        multiArgs = !!options.multiArgs,
                        ret = promisify(fn, receiver, multiArgs);
                    return util.copyDescriptors(fn, ret, propsFilter), ret
                }, Promise.promisifyAll = function(target, options) {
                    if ("function" != typeof target && "object" != typeof target) throw new TypeError("the target of promisifyAll must be an object or a function\n\n    See http://goo.gl/MqrFmX\n");
                    options = Object(options);
                    var multiArgs = !!options.multiArgs,
                        suffix = options.suffix;
                    "string" != typeof suffix && (suffix = defaultSuffix);
                    var filter = options.filter;
                    "function" != typeof filter && (filter = defaultFilter);
                    var promisifier = options.promisifier;
                    if ("function" != typeof promisifier && (promisifier = makeNodePromisified), !util.isIdentifier(suffix)) throw new RangeError("suffix must be a valid identifier\n\n    See http://goo.gl/MqrFmX\n");
                    for (var keys = util.inheritedDataKeys(target), i = 0; i < keys.length; ++i) {
                        var value = target[keys[i]];
                        "constructor" !== keys[i] && util.isClass(value) && (promisifyAll(value.prototype, suffix, filter, promisifier, multiArgs), promisifyAll(value, suffix, filter, promisifier, multiArgs))
                    }
                    return promisifyAll(target, suffix, filter, promisifier, multiArgs)
                }
            }
        }, {
            "./errors": 50,
            "./nodeback": 58,
            "./util": 74
        }],
        63: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, PromiseArray, tryConvertToPromise, apiRejection) {
                function PropertiesPromiseArray(obj) {
                    var entries, isMap = !1;
                    if (void 0 !== Es6Map && obj instanceof Es6Map) entries = mapToEntries(obj), isMap = !0;
                    else {
                        var keys = es5.keys(obj),
                            len = keys.length;
                        entries = new Array(2 * len);
                        for (var i = 0; len > i; ++i) {
                            var key = keys[i];
                            entries[i] = obj[key], entries[i + len] = key
                        }
                    }
                    this.constructor$(entries), this._isMap = isMap, this._init$(void 0, -3)
                }

                function props(promises) {
                    var ret, castValue = tryConvertToPromise(promises);
                    return isObject(castValue) ? (ret = castValue instanceof Promise ? castValue._then(Promise.props, void 0, void 0, void 0, void 0) : new PropertiesPromiseArray(castValue).promise(), castValue instanceof Promise && ret._propagateFrom(castValue, 2), ret) : apiRejection("cannot await properties of a non-object\n\n    See http://goo.gl/MqrFmX\n")
                }
                var Es6Map, util = require("./util"),
                    isObject = util.isObject,
                    es5 = require("./es5");
                "function" == typeof Map && (Es6Map = Map);
                var mapToEntries = function() {
                        function extractEntry(value, key) {
                            this[index] = value, this[index + size] = key, index++
                        }
                        var index = 0,
                            size = 0;
                        return function(map) {
                            size = map.size, index = 0;
                            var ret = new Array(2 * map.size);
                            return map.forEach(extractEntry, ret), ret
                        }
                    }(),
                    entriesToMap = function(entries) {
                        for (var ret = new Es6Map, length = entries.length / 2 | 0, i = 0; length > i; ++i) {
                            var key = entries[length + i],
                                value = entries[i];
                            ret.set(key, value)
                        }
                        return ret
                    };
                util.inherits(PropertiesPromiseArray, PromiseArray), PropertiesPromiseArray.prototype._init = function() {}, PropertiesPromiseArray.prototype._promiseFulfilled = function(value, index) {
                    this._values[index] = value;
                    var totalResolved = ++this._totalResolved;
                    if (totalResolved >= this._length) {
                        var val;
                        if (this._isMap) val = entriesToMap(this._values);
                        else {
                            val = {};
                            for (var keyOffset = this.length(), i = 0, len = this.length(); len > i; ++i) val[this._values[i + keyOffset]] = this._values[i]
                        }
                        return this._resolve(val), !0
                    }
                    return !1
                }, PropertiesPromiseArray.prototype.shouldCopyValues = function() {
                    return !1
                }, PropertiesPromiseArray.prototype.getActualLength = function(len) {
                    return len >> 1
                }, Promise.prototype.props = function() {
                    return props(this)
                }, Promise.props = function(promises) {
                    return props(promises)
                }
            }
        }, {
            "./es5": 51,
            "./util": 74
        }],
        64: [function(require, module, exports) {
            "use strict";

            function arrayMove(src, srcIndex, dst, dstIndex, len) {
                for (var j = 0; len > j; ++j) dst[j + dstIndex] = src[j + srcIndex], src[j + srcIndex] = void 0
            }

            function Queue(capacity) {
                this._capacity = capacity, this._length = 0, this._front = 0
            }
            Queue.prototype._willBeOverCapacity = function(size) {
                return this._capacity < size
            }, Queue.prototype._pushOne = function(arg) {
                var length = this.length();
                this._checkCapacity(length + 1);
                var i = this._front + length & this._capacity - 1;
                this[i] = arg, this._length = length + 1
            }, Queue.prototype.push = function(fn, receiver, arg) {
                var length = this.length() + 3;
                if (this._willBeOverCapacity(length)) return this._pushOne(fn), this._pushOne(receiver), void this._pushOne(arg);
                var j = this._front + length - 3;
                this._checkCapacity(length);
                var wrapMask = this._capacity - 1;
                this[j + 0 & wrapMask] = fn, this[j + 1 & wrapMask] = receiver, this[j + 2 & wrapMask] = arg, this._length = length
            }, Queue.prototype.shift = function() {
                var front = this._front,
                    ret = this[front];
                return this[front] = void 0, this._front = front + 1 & this._capacity - 1, this._length--, ret
            }, Queue.prototype.length = function() {
                return this._length
            }, Queue.prototype._checkCapacity = function(size) {
                this._capacity < size && this._resizeTo(this._capacity << 1)
            }, Queue.prototype._resizeTo = function(capacity) {
                var oldCapacity = this._capacity;
                this._capacity = capacity;
                var front = this._front,
                    length = this._length,
                    moveItemsCount = front + length & oldCapacity - 1;
                arrayMove(this, 0, this, oldCapacity, moveItemsCount)
            }, module.exports = Queue
        }, {}],
        65: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL, tryConvertToPromise, apiRejection) {
                function race(promises, parent) {
                    var maybePromise = tryConvertToPromise(promises);
                    if (maybePromise instanceof Promise) return raceLater(maybePromise);
                    if (promises = util.asArray(promises), null === promises) return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
                    var ret = new Promise(INTERNAL);
                    void 0 !== parent && ret._propagateFrom(parent, 3);
                    for (var fulfill = ret._fulfill, reject = ret._reject, i = 0, len = promises.length; len > i; ++i) {
                        var val = promises[i];
                        (void 0 !== val || i in promises) && Promise.cast(val)._then(fulfill, reject, void 0, ret, null)
                    }
                    return ret
                }
                var util = require("./util"),
                    raceLater = function(promise) {
                        return promise.then(function(array) {
                            return race(array, promise)
                        })
                    };
                Promise.race = function(promises) {
                    return race(promises, void 0)
                }, Promise.prototype.race = function() {
                    return race(this, void 0)
                }
            }
        }, {
            "./util": 74
        }],
        66: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug) {
                function ReductionPromiseArray(promises, fn, initialValue, _each) {
                    this.constructor$(promises);
                    var domain = getDomain();
                    this._fn = null === domain ? fn : util.domainBind(domain, fn), void 0 !== initialValue && (initialValue = Promise.resolve(initialValue), initialValue._attachCancellationCallback(this)), this._initialValue = initialValue, this._currentCancellable = null, _each === INTERNAL ? this._eachValues = Array(this._length) : 0 === _each ? this._eachValues = null : this._eachValues = void 0, this._promise._captureStackTrace(), this._init$(void 0, -5)
                }

                function completed(valueOrReason, array) {
                    this.isFulfilled() ? array._resolve(valueOrReason) : array._reject(valueOrReason)
                }

                function reduce(promises, fn, initialValue, _each) {
                    if ("function" != typeof fn) return apiRejection("expecting a function but got " + util.classString(fn));
                    var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
                    return array.promise()
                }

                function gotAccum(accum) {
                    this.accum = accum, this.array._gotAccum(accum);
                    var value = tryConvertToPromise(this.value, this.array._promise);
                    return value instanceof Promise ? (this.array._currentCancellable = value, value._then(gotValue, void 0, void 0, this, void 0)) : gotValue.call(this, value)
                }

                function gotValue(value) {
                    var array = this.array,
                        promise = array._promise,
                        fn = tryCatch(array._fn);
                    promise._pushContext();
                    var ret;
                    ret = void 0 !== array._eachValues ? fn.call(promise._boundValue(), value, this.index, this.length) : fn.call(promise._boundValue(), this.accum, value, this.index, this.length), ret instanceof Promise && (array._currentCancellable = ret);
                    var promiseCreated = promise._popContext();
                    return debug.checkForgottenReturns(ret, promiseCreated, void 0 !== array._eachValues ? "Promise.each" : "Promise.reduce", promise), ret
                }
                var getDomain = Promise._getDomain,
                    util = require("./util"),
                    tryCatch = util.tryCatch;
                util.inherits(ReductionPromiseArray, PromiseArray), ReductionPromiseArray.prototype._gotAccum = function(accum) {
                    void 0 !== this._eachValues && null !== this._eachValues && accum !== INTERNAL && this._eachValues.push(accum)
                }, ReductionPromiseArray.prototype._eachComplete = function(value) {
                    return null !== this._eachValues && this._eachValues.push(value), this._eachValues
                }, ReductionPromiseArray.prototype._init = function() {}, ReductionPromiseArray.prototype._resolveEmptyArray = function() {
                    this._resolve(void 0 !== this._eachValues ? this._eachValues : this._initialValue)
                }, ReductionPromiseArray.prototype.shouldCopyValues = function() {
                    return !1
                }, ReductionPromiseArray.prototype._resolve = function(value) {
                    this._promise._resolveCallback(value), this._values = null
                }, ReductionPromiseArray.prototype._resultCancelled = function(sender) {
                    return sender === this._initialValue ? this._cancel() : void(this._isResolved() || (this._resultCancelled$(), this._currentCancellable instanceof Promise && this._currentCancellable.cancel(), this._initialValue instanceof Promise && this._initialValue.cancel()))
                }, ReductionPromiseArray.prototype._iterate = function(values) {
                    this._values = values;
                    var value, i, length = values.length;
                    if (void 0 !== this._initialValue ? (value = this._initialValue, i = 0) : (value = Promise.resolve(values[0]), i = 1), this._currentCancellable = value, !value.isRejected())
                        for (; length > i; ++i) {
                            var ctx = {
                                accum: null,
                                value: values[i],
                                index: i,
                                length: length,
                                array: this
                            };
                            value = value._then(gotAccum, void 0, void 0, ctx, void 0)
                        }
                    void 0 !== this._eachValues && (value = value._then(this._eachComplete, void 0, void 0, this, void 0)), value._then(completed, completed, void 0, value, this)
                }, Promise.prototype.reduce = function(fn, initialValue) {
                    return reduce(this, fn, initialValue, null)
                }, Promise.reduce = function(promises, fn, initialValue, _each) {
                    return reduce(promises, fn, initialValue, _each)
                }
            }
        }, {
            "./util": 74
        }],
        67: [function(require, module, exports) {
            (function(process, global) {
                "use strict";
                var schedule, util = require("./util"),
                    noAsyncScheduler = function() {
                        throw new Error("No async scheduler available\n\n    See http://goo.gl/MqrFmX\n")
                    },
                    NativePromise = util.getNativePromise();
                if (util.isNode && "undefined" == typeof MutationObserver) {
                    var GlobalSetImmediate = global.setImmediate,
                        ProcessNextTick = process.nextTick;
                    schedule = util.isRecentNode ? function(fn) {
                        GlobalSetImmediate.call(global, fn)
                    } : function(fn) {
                        ProcessNextTick.call(process, fn)
                    }
                } else if ("function" == typeof NativePromise && "function" == typeof NativePromise.resolve) {
                    var nativePromise = NativePromise.resolve();
                    schedule = function(fn) {
                        nativePromise.then(fn)
                    }
                } else schedule = "undefined" == typeof MutationObserver || "undefined" != typeof window && window.navigator && (window.navigator.standalone || window.cordova) ? "undefined" != typeof setImmediate ? function(fn) {
                    setImmediate(fn)
                } : "undefined" != typeof setTimeout ? function(fn) {
                    setTimeout(fn, 0)
                } : noAsyncScheduler : function() {
                    var div = document.createElement("div"),
                        opts = {
                            attributes: !0
                        },
                        toggleScheduled = !1,
                        div2 = document.createElement("div"),
                        o2 = new MutationObserver(function() {
                            div.classList.toggle("foo"), toggleScheduled = !1
                        });
                    o2.observe(div2, opts);
                    var scheduleToggle = function() {
                        toggleScheduled || (toggleScheduled = !0, div2.classList.toggle("foo"))
                    };
                    return function(fn) {
                        var o = new MutationObserver(function() {
                            o.disconnect(), fn()
                        });
                        o.observe(div, opts), scheduleToggle()
                    }
                }();
                module.exports = schedule
            }).call(this, require("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            "./util": 74,
            _process: 138
        }],
        68: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, PromiseArray, debug) {
                function SettledPromiseArray(values) {
                    this.constructor$(values)
                }
                var PromiseInspection = Promise.PromiseInspection,
                    util = require("./util");
                util.inherits(SettledPromiseArray, PromiseArray), SettledPromiseArray.prototype._promiseResolved = function(index, inspection) {
                    this._values[index] = inspection;
                    var totalResolved = ++this._totalResolved;
                    return totalResolved >= this._length ? (this._resolve(this._values), !0) : !1
                }, SettledPromiseArray.prototype._promiseFulfilled = function(value, index) {
                    var ret = new PromiseInspection;
                    return ret._bitField = 33554432, ret._settledValueField = value, this._promiseResolved(index, ret)
                }, SettledPromiseArray.prototype._promiseRejected = function(reason, index) {
                    var ret = new PromiseInspection;
                    return ret._bitField = 16777216, ret._settledValueField = reason, this._promiseResolved(index, ret)
                }, Promise.settle = function(promises) {
                    return debug.deprecated(".settle()", ".reflect()"), new SettledPromiseArray(promises).promise()
                }, Promise.prototype.settle = function() {
                    return Promise.settle(this)
                }
            }
        }, {
            "./util": 74
        }],
        69: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, PromiseArray, apiRejection) {
                function SomePromiseArray(values) {
                    this.constructor$(values), this._howMany = 0, this._unwrap = !1, this._initialized = !1
                }

                function some(promises, howMany) {
                    if ((0 | howMany) !== howMany || 0 > howMany) return apiRejection("expecting a positive integer\n\n    See http://goo.gl/MqrFmX\n");
                    var ret = new SomePromiseArray(promises),
                        promise = ret.promise();
                    return ret.setHowMany(howMany), ret.init(), promise
                }
                var util = require("./util"),
                    RangeError = require("./errors").RangeError,
                    AggregateError = require("./errors").AggregateError,
                    isArray = util.isArray,
                    CANCELLATION = {};
                util.inherits(SomePromiseArray, PromiseArray), SomePromiseArray.prototype._init = function() {
                    if (this._initialized) {
                        if (0 === this._howMany) return void this._resolve([]);
                        this._init$(void 0, -5);
                        var isArrayResolved = isArray(this._values);
                        !this._isResolved() && isArrayResolved && this._howMany > this._canPossiblyFulfill() && this._reject(this._getRangeError(this.length()))
                    }
                }, SomePromiseArray.prototype.init = function() {
                    this._initialized = !0, this._init()
                }, SomePromiseArray.prototype.setUnwrap = function() {
                    this._unwrap = !0
                }, SomePromiseArray.prototype.howMany = function() {
                    return this._howMany
                }, SomePromiseArray.prototype.setHowMany = function(count) {
                    this._howMany = count
                }, SomePromiseArray.prototype._promiseFulfilled = function(value) {
                    return this._addFulfilled(value), this._fulfilled() === this.howMany() ? (this._values.length = this.howMany(), 1 === this.howMany() && this._unwrap ? this._resolve(this._values[0]) : this._resolve(this._values), !0) : !1
                }, SomePromiseArray.prototype._promiseRejected = function(reason) {
                    return this._addRejected(reason), this._checkOutcome()
                }, SomePromiseArray.prototype._promiseCancelled = function() {
                    return this._values instanceof Promise || null == this._values ? this._cancel() : (this._addRejected(CANCELLATION), this._checkOutcome())
                }, SomePromiseArray.prototype._checkOutcome = function() {
                    if (this.howMany() > this._canPossiblyFulfill()) {
                        for (var e = new AggregateError, i = this.length(); i < this._values.length; ++i) this._values[i] !== CANCELLATION && e.push(this._values[i]);
                        return e.length > 0 ? this._reject(e) : this._cancel(), !0
                    }
                    return !1
                }, SomePromiseArray.prototype._fulfilled = function() {
                    return this._totalResolved
                }, SomePromiseArray.prototype._rejected = function() {
                    return this._values.length - this.length();
                }, SomePromiseArray.prototype._addRejected = function(reason) {
                    this._values.push(reason)
                }, SomePromiseArray.prototype._addFulfilled = function(value) {
                    this._values[this._totalResolved++] = value
                }, SomePromiseArray.prototype._canPossiblyFulfill = function() {
                    return this.length() - this._rejected()
                }, SomePromiseArray.prototype._getRangeError = function(count) {
                    var message = "Input array must contain at least " + this._howMany + " items but contains only " + count + " items";
                    return new RangeError(message)
                }, SomePromiseArray.prototype._resolveEmptyArray = function() {
                    this._reject(this._getRangeError(0))
                }, Promise.some = function(promises, howMany) {
                    return some(promises, howMany)
                }, Promise.prototype.some = function(howMany) {
                    return some(this, howMany)
                }, Promise._SomePromiseArray = SomePromiseArray
            }
        }, {
            "./errors": 50,
            "./util": 74
        }],
        70: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise) {
                function PromiseInspection(promise) {
                    void 0 !== promise ? (promise = promise._target(), this._bitField = promise._bitField, this._settledValueField = promise._isFateSealed() ? promise._settledValue() : void 0) : (this._bitField = 0, this._settledValueField = void 0)
                }
                PromiseInspection.prototype._settledValue = function() {
                    return this._settledValueField
                };
                var value = PromiseInspection.prototype.value = function() {
                        if (!this.isFulfilled()) throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\n\n    See http://goo.gl/MqrFmX\n");
                        return this._settledValue()
                    },
                    reason = PromiseInspection.prototype.error = PromiseInspection.prototype.reason = function() {
                        if (!this.isRejected()) throw new TypeError("cannot get rejection reason of a non-rejected promise\n\n    See http://goo.gl/MqrFmX\n");
                        return this._settledValue()
                    },
                    isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
                        return 0 !== (33554432 & this._bitField)
                    },
                    isRejected = PromiseInspection.prototype.isRejected = function() {
                        return 0 !== (16777216 & this._bitField)
                    },
                    isPending = PromiseInspection.prototype.isPending = function() {
                        return 0 === (50397184 & this._bitField)
                    },
                    isResolved = PromiseInspection.prototype.isResolved = function() {
                        return 0 !== (50331648 & this._bitField)
                    };
                PromiseInspection.prototype.isCancelled = function() {
                    return 0 !== (8454144 & this._bitField)
                }, Promise.prototype.__isCancelled = function() {
                    return 65536 === (65536 & this._bitField)
                }, Promise.prototype._isCancelled = function() {
                    return this._target().__isCancelled()
                }, Promise.prototype.isCancelled = function() {
                    return 0 !== (8454144 & this._target()._bitField)
                }, Promise.prototype.isPending = function() {
                    return isPending.call(this._target())
                }, Promise.prototype.isRejected = function() {
                    return isRejected.call(this._target())
                }, Promise.prototype.isFulfilled = function() {
                    return isFulfilled.call(this._target())
                }, Promise.prototype.isResolved = function() {
                    return isResolved.call(this._target())
                }, Promise.prototype.value = function() {
                    return value.call(this._target())
                }, Promise.prototype.reason = function() {
                    var target = this._target();
                    return target._unsetRejectionIsUnhandled(), reason.call(target)
                }, Promise.prototype._value = function() {
                    return this._settledValue()
                }, Promise.prototype._reason = function() {
                    return this._unsetRejectionIsUnhandled(), this._settledValue()
                }, Promise.PromiseInspection = PromiseInspection
            }
        }, {}],
        71: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL) {
                function tryConvertToPromise(obj, context) {
                    if (isObject(obj)) {
                        if (obj instanceof Promise) return obj;
                        var then = getThen(obj);
                        if (then === errorObj) {
                            context && context._pushContext();
                            var ret = Promise.reject(then.e);
                            return context && context._popContext(), ret
                        }
                        if ("function" == typeof then) {
                            if (isAnyBluebirdPromise(obj)) {
                                var ret = new Promise(INTERNAL);
                                return obj._then(ret._fulfill, ret._reject, void 0, ret, null), ret
                            }
                            return doThenable(obj, then, context)
                        }
                    }
                    return obj
                }

                function doGetThen(obj) {
                    return obj.then
                }

                function getThen(obj) {
                    try {
                        return doGetThen(obj)
                    } catch (e) {
                        return errorObj.e = e, errorObj
                    }
                }

                function isAnyBluebirdPromise(obj) {
                    try {
                        return hasProp.call(obj, "_promise0")
                    } catch (e) {
                        return !1
                    }
                }

                function doThenable(x, then, context) {
                    function resolve(value) {
                        promise && (promise._resolveCallback(value), promise = null)
                    }

                    function reject(reason) {
                        promise && (promise._rejectCallback(reason, synchronous, !0), promise = null)
                    }
                    var promise = new Promise(INTERNAL),
                        ret = promise;
                    context && context._pushContext(), promise._captureStackTrace(), context && context._popContext();
                    var synchronous = !0,
                        result = util.tryCatch(then).call(x, resolve, reject);
                    return synchronous = !1, promise && result === errorObj && (promise._rejectCallback(result.e, !0, !0), promise = null), ret
                }
                var util = require("./util"),
                    errorObj = util.errorObj,
                    isObject = util.isObject,
                    hasProp = {}.hasOwnProperty;
                return tryConvertToPromise
            }
        }, {
            "./util": 74
        }],
        72: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, INTERNAL, debug) {
                function HandleWrapper(handle) {
                    this.handle = handle
                }

                function successClear(value) {
                    return clearTimeout(this.handle), value
                }

                function failureClear(reason) {
                    throw clearTimeout(this.handle), reason
                }
                var util = require("./util"),
                    TimeoutError = Promise.TimeoutError;
                HandleWrapper.prototype._resultCancelled = function() {
                    clearTimeout(this.handle)
                };
                var afterValue = function(value) {
                        return delay(+this).thenReturn(value)
                    },
                    delay = Promise.delay = function(ms, value) {
                        var ret, handle;
                        return void 0 !== value ? (ret = Promise.resolve(value)._then(afterValue, null, null, ms, void 0), debug.cancellation() && value instanceof Promise && ret._setOnCancel(value)) : (ret = new Promise(INTERNAL), handle = setTimeout(function() {
                            ret._fulfill()
                        }, +ms), debug.cancellation() && ret._setOnCancel(new HandleWrapper(handle)), ret._captureStackTrace()), ret._setAsyncGuaranteed(), ret
                    };
                Promise.prototype.delay = function(ms) {
                    return delay(ms, this)
                };
                var afterTimeout = function(promise, message, parent) {
                    var err;
                    err = "string" != typeof message ? message instanceof Error ? message : new TimeoutError("operation timed out") : new TimeoutError(message), util.markAsOriginatingFromRejection(err), promise._attachExtraTrace(err), promise._reject(err), null != parent && parent.cancel()
                };
                Promise.prototype.timeout = function(ms, message) {
                    ms = +ms;
                    var ret, parent, handleWrapper = new HandleWrapper(setTimeout(function() {
                        ret.isPending() && afterTimeout(ret, message, parent)
                    }, ms));
                    return debug.cancellation() ? (parent = this.then(), ret = parent._then(successClear, failureClear, void 0, handleWrapper, void 0), ret._setOnCancel(handleWrapper)) : ret = this._then(successClear, failureClear, void 0, handleWrapper, void 0), ret
                }
            }
        }, {
            "./util": 74
        }],
        73: [function(require, module, exports) {
            "use strict";
            module.exports = function(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug) {
                function thrower(e) {
                    setTimeout(function() {
                        throw e
                    }, 0)
                }

                function castPreservingDisposable(thenable) {
                    var maybePromise = tryConvertToPromise(thenable);
                    return maybePromise !== thenable && "function" == typeof thenable._isDisposable && "function" == typeof thenable._getDisposer && thenable._isDisposable() && maybePromise._setDisposable(thenable._getDisposer()), maybePromise
                }

                function dispose(resources, inspection) {
                    function iterator() {
                        if (i >= len) return ret._fulfill();
                        var maybePromise = castPreservingDisposable(resources[i++]);
                        if (maybePromise instanceof Promise && maybePromise._isDisposable()) {
                            try {
                                maybePromise = tryConvertToPromise(maybePromise._getDisposer().tryDispose(inspection), resources.promise)
                            } catch (e) {
                                return thrower(e)
                            }
                            if (maybePromise instanceof Promise) return maybePromise._then(iterator, thrower, null, null, null)
                        }
                        iterator()
                    }
                    var i = 0,
                        len = resources.length,
                        ret = new Promise(INTERNAL);
                    return iterator(), ret
                }

                function Disposer(data, promise, context) {
                    this._data = data, this._promise = promise, this._context = context
                }

                function FunctionDisposer(fn, promise, context) {
                    this.constructor$(fn, promise, context)
                }

                function maybeUnwrapDisposer(value) {
                    return Disposer.isDisposer(value) ? (this.resources[this.index]._setDisposable(value), value.promise()) : value
                }

                function ResourceList(length) {
                    this.length = length, this.promise = null, this[length - 1] = null
                }
                var util = require("./util"),
                    TypeError = require("./errors").TypeError,
                    inherits = require("./util").inherits,
                    errorObj = util.errorObj,
                    tryCatch = util.tryCatch,
                    NULL = {};
                Disposer.prototype.data = function() {
                    return this._data
                }, Disposer.prototype.promise = function() {
                    return this._promise
                }, Disposer.prototype.resource = function() {
                    return this.promise().isFulfilled() ? this.promise().value() : NULL
                }, Disposer.prototype.tryDispose = function(inspection) {
                    var resource = this.resource(),
                        context = this._context;
                    void 0 !== context && context._pushContext();
                    var ret = resource !== NULL ? this.doDispose(resource, inspection) : null;
                    return void 0 !== context && context._popContext(), this._promise._unsetDisposable(), this._data = null, ret
                }, Disposer.isDisposer = function(d) {
                    return null != d && "function" == typeof d.resource && "function" == typeof d.tryDispose
                }, inherits(FunctionDisposer, Disposer), FunctionDisposer.prototype.doDispose = function(resource, inspection) {
                    var fn = this.data();
                    return fn.call(resource, resource, inspection)
                }, ResourceList.prototype._resultCancelled = function() {
                    for (var len = this.length, i = 0; len > i; ++i) {
                        var item = this[i];
                        item instanceof Promise && item.cancel()
                    }
                }, Promise.using = function() {
                    var len = arguments.length;
                    if (2 > len) return apiRejection("you must pass at least 2 arguments to Promise.using");
                    var fn = arguments[len - 1];
                    if ("function" != typeof fn) return apiRejection("expecting a function but got " + util.classString(fn));
                    var input, spreadArgs = !0;
                    2 === len && Array.isArray(arguments[0]) ? (input = arguments[0], len = input.length, spreadArgs = !1) : (input = arguments, len--);
                    for (var resources = new ResourceList(len), i = 0; len > i; ++i) {
                        var resource = input[i];
                        if (Disposer.isDisposer(resource)) {
                            var disposer = resource;
                            resource = resource.promise(), resource._setDisposable(disposer)
                        } else {
                            var maybePromise = tryConvertToPromise(resource);
                            maybePromise instanceof Promise && (resource = maybePromise._then(maybeUnwrapDisposer, null, null, {
                                resources: resources,
                                index: i
                            }, void 0))
                        }
                        resources[i] = resource
                    }
                    for (var reflectedResources = new Array(resources.length), i = 0; i < reflectedResources.length; ++i) reflectedResources[i] = Promise.resolve(resources[i]).reflect();
                    var resultPromise = Promise.all(reflectedResources).then(function(inspections) {
                            for (var i = 0; i < inspections.length; ++i) {
                                var inspection = inspections[i];
                                if (inspection.isRejected()) return errorObj.e = inspection.error(), errorObj;
                                if (!inspection.isFulfilled()) return void resultPromise.cancel();
                                inspections[i] = inspection.value()
                            }
                            promise._pushContext(), fn = tryCatch(fn);
                            var ret = spreadArgs ? fn.apply(void 0, inspections) : fn(inspections),
                                promiseCreated = promise._popContext();
                            return debug.checkForgottenReturns(ret, promiseCreated, "Promise.using", promise), ret
                        }),
                        promise = resultPromise.lastly(function() {
                            var inspection = new Promise.PromiseInspection(resultPromise);
                            return dispose(resources, inspection)
                        });
                    return resources.promise = promise, promise._setOnCancel(resources), promise
                }, Promise.prototype._setDisposable = function(disposer) {
                    this._bitField = 131072 | this._bitField, this._disposer = disposer
                }, Promise.prototype._isDisposable = function() {
                    return (131072 & this._bitField) > 0
                }, Promise.prototype._getDisposer = function() {
                    return this._disposer
                }, Promise.prototype._unsetDisposable = function() {
                    this._bitField = -131073 & this._bitField, this._disposer = void 0
                }, Promise.prototype.disposer = function(fn) {
                    if ("function" == typeof fn) return new FunctionDisposer(fn, this, createContext());
                    throw new TypeError
                }
            }
        }, {
            "./errors": 50,
            "./util": 74
        }],
        74: [function(require, module, exports) {
            (function(process, global) {
                "use strict";

                function tryCatcher() {
                    try {
                        var target = tryCatchTarget;
                        return tryCatchTarget = null, target.apply(this, arguments)
                    } catch (e) {
                        return errorObj.e = e, errorObj
                    }
                }

                function tryCatch(fn) {
                    return tryCatchTarget = fn, tryCatcher
                }

                function isPrimitive(val) {
                    return null == val || val === !0 || val === !1 || "string" == typeof val || "number" == typeof val
                }

                function isObject(value) {
                    return "function" == typeof value || "object" == typeof value && null !== value
                }

                function maybeWrapAsError(maybeError) {
                    return isPrimitive(maybeError) ? new Error(safeToString(maybeError)) : maybeError
                }

                function withAppended(target, appendee) {
                    var i, len = target.length,
                        ret = new Array(len + 1);
                    for (i = 0; len > i; ++i) ret[i] = target[i];
                    return ret[i] = appendee, ret
                }

                function getDataPropertyOrDefault(obj, key, defaultValue) {
                    if (!es5.isES5) return {}.hasOwnProperty.call(obj, key) ? obj[key] : void 0;
                    var desc = Object.getOwnPropertyDescriptor(obj, key);
                    return null != desc ? null == desc.get && null == desc.set ? desc.value : defaultValue : void 0
                }

                function notEnumerableProp(obj, name, value) {
                    if (isPrimitive(obj)) return obj;
                    var descriptor = {
                        value: value,
                        configurable: !0,
                        enumerable: !1,
                        writable: !0
                    };
                    return es5.defineProperty(obj, name, descriptor), obj
                }

                function thrower(r) {
                    throw r
                }

                function isClass(fn) {
                    try {
                        if ("function" == typeof fn) {
                            var keys = es5.names(fn.prototype),
                                hasMethods = es5.isES5 && keys.length > 1,
                                hasMethodsOtherThanConstructor = keys.length > 0 && !(1 === keys.length && "constructor" === keys[0]),
                                hasThisAssignmentAndStaticMethods = thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;
                            if (hasMethods || hasMethodsOtherThanConstructor || hasThisAssignmentAndStaticMethods) return !0
                        }
                        return !1
                    } catch (e) {
                        return !1
                    }
                }

                function toFastProperties(obj) {
                    function FakeConstructor() {}
                    FakeConstructor.prototype = obj;
                    for (var l = 8; l--;) new FakeConstructor;
                    return obj
                }

                function isIdentifier(str) {
                    return rident.test(str)
                }

                function filledRange(count, prefix, suffix) {
                    for (var ret = new Array(count), i = 0; count > i; ++i) ret[i] = prefix + i + suffix;
                    return ret
                }

                function safeToString(obj) {
                    try {
                        return obj + ""
                    } catch (e) {
                        return "[no string representation]"
                    }
                }

                function isError(obj) {
                    return null !== obj && "object" == typeof obj && "string" == typeof obj.message && "string" == typeof obj.name
                }

                function markAsOriginatingFromRejection(e) {
                    try {
                        notEnumerableProp(e, "isOperational", !0)
                    } catch (ignore) {}
                }

                function originatesFromRejection(e) {
                    return null == e ? !1 : e instanceof Error.__BluebirdErrorTypes__.OperationalError || e.isOperational === !0
                }

                function canAttachTrace(obj) {
                    return isError(obj) && es5.propertyIsWritable(obj, "stack")
                }

                function classString(obj) {
                    return {}.toString.call(obj)
                }

                function copyDescriptors(from, to, filter) {
                    for (var keys = es5.names(from), i = 0; i < keys.length; ++i) {
                        var key = keys[i];
                        if (filter(key)) try {
                            es5.defineProperty(to, key, es5.getDescriptor(from, key))
                        } catch (ignore) {}
                    }
                }

                function env(key) {
                    return hasEnvVariables ? process.env[key] : void 0
                }

                function getNativePromise() {
                    if ("function" == typeof Promise) try {
                        var promise = new Promise(function() {});
                        if ("[object Promise]" === {}.toString.call(promise)) return Promise
                    } catch (e) {}
                }

                function domainBind(self, cb) {
                    return self.bind(cb)
                }
                var es5 = require("./es5"),
                    canEvaluate = "undefined" == typeof navigator,
                    errorObj = {
                        e: {}
                    },
                    tryCatchTarget, globalObject = "undefined" != typeof self ? self : "undefined" != typeof window ? window : "undefined" != typeof global ? global : void 0 !== this ? this : null,
                    inherits = function(Child, Parent) {
                        function T() {
                            this.constructor = Child, this.constructor$ = Parent;
                            for (var propertyName in Parent.prototype) hasProp.call(Parent.prototype, propertyName) && "$" !== propertyName.charAt(propertyName.length - 1) && (this[propertyName + "$"] = Parent.prototype[propertyName])
                        }
                        var hasProp = {}.hasOwnProperty;
                        return T.prototype = Parent.prototype, Child.prototype = new T, Child.prototype
                    },
                    inheritedDataKeys = function() {
                        var excludedPrototypes = [Array.prototype, Object.prototype, Function.prototype],
                            isExcludedProto = function(val) {
                                for (var i = 0; i < excludedPrototypes.length; ++i)
                                    if (excludedPrototypes[i] === val) return !0;
                                return !1
                            };
                        if (es5.isES5) {
                            var getKeys = Object.getOwnPropertyNames;
                            return function(obj) {
                                for (var ret = [], visitedKeys = Object.create(null); null != obj && !isExcludedProto(obj);) {
                                    var keys;
                                    try {
                                        keys = getKeys(obj)
                                    } catch (e) {
                                        return ret
                                    }
                                    for (var i = 0; i < keys.length; ++i) {
                                        var key = keys[i];
                                        if (!visitedKeys[key]) {
                                            visitedKeys[key] = !0;
                                            var desc = Object.getOwnPropertyDescriptor(obj, key);
                                            null != desc && null == desc.get && null == desc.set && ret.push(key)
                                        }
                                    }
                                    obj = es5.getPrototypeOf(obj)
                                }
                                return ret
                            }
                        }
                        var hasProp = {}.hasOwnProperty;
                        return function(obj) {
                            if (isExcludedProto(obj)) return [];
                            var ret = [];
                            enumeration: for (var key in obj)
                                if (hasProp.call(obj, key)) ret.push(key);
                                else {
                                    for (var i = 0; i < excludedPrototypes.length; ++i)
                                        if (hasProp.call(excludedPrototypes[i], key)) continue enumeration;
                                    ret.push(key)
                                }
                            return ret
                        }
                    }(),
                    thisAssignmentPattern = /this\s*\.\s*\S+\s*=/,
                    rident = /^[a-z$_][a-z$_0-9]*$/i,
                    ensureErrorObject = function() {
                        return "stack" in new Error ? function(value) {
                            return canAttachTrace(value) ? value : new Error(safeToString(value))
                        } : function(value) {
                            if (canAttachTrace(value)) return value;
                            try {
                                throw new Error(safeToString(value))
                            } catch (err) {
                                return err
                            }
                        }
                    }(),
                    asArray = function(v) {
                        return es5.isArray(v) ? v : null
                    };
                if ("undefined" != typeof Symbol && Symbol.iterator) {
                    var ArrayFrom = "function" == typeof Array.from ? function(v) {
                        return Array.from(v)
                    } : function(v) {
                        for (var itResult, ret = [], it = v[Symbol.iterator](); !(itResult = it.next()).done;) ret.push(itResult.value);
                        return ret
                    };
                    asArray = function(v) {
                        return es5.isArray(v) ? v : null != v && "function" == typeof v[Symbol.iterator] ? ArrayFrom(v) : null
                    }
                }
                var isNode = "undefined" != typeof process && "[object process]" === classString(process).toLowerCase(),
                    hasEnvVariables = "undefined" != typeof process && "undefined" != typeof process.env,
                    ret = {
                        isClass: isClass,
                        isIdentifier: isIdentifier,
                        inheritedDataKeys: inheritedDataKeys,
                        getDataPropertyOrDefault: getDataPropertyOrDefault,
                        thrower: thrower,
                        isArray: es5.isArray,
                        asArray: asArray,
                        notEnumerableProp: notEnumerableProp,
                        isPrimitive: isPrimitive,
                        isObject: isObject,
                        isError: isError,
                        canEvaluate: canEvaluate,
                        errorObj: errorObj,
                        tryCatch: tryCatch,
                        inherits: inherits,
                        withAppended: withAppended,
                        maybeWrapAsError: maybeWrapAsError,
                        toFastProperties: toFastProperties,
                        filledRange: filledRange,
                        toString: safeToString,
                        canAttachTrace: canAttachTrace,
                        ensureErrorObject: ensureErrorObject,
                        originatesFromRejection: originatesFromRejection,
                        markAsOriginatingFromRejection: markAsOriginatingFromRejection,
                        classString: classString,
                        copyDescriptors: copyDescriptors,
                        hasDevTools: "undefined" != typeof chrome && chrome && "function" == typeof chrome.loadTimes,
                        isNode: isNode,
                        hasEnvVariables: hasEnvVariables,
                        env: env,
                        global: globalObject,
                        getNativePromise: getNativePromise,
                        domainBind: domainBind
                    };
                ret.isRecentNode = ret.isNode && function() {
                    var version = process.versions.node.split(".").map(Number);
                    return 0 === version[0] && version[1] > 10 || version[0] > 0
                }(), ret.isNode && ret.toFastProperties(process);
                try {
                    throw new Error
                } catch (e) {
                    ret.lastLineError = e
                }
                module.exports = ret
            }).call(this, require("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            "./es5": 51,
            _process: 138
        }],
        75: [function(require, module, exports) {}, {}],
        76: [function(require, module, exports) {
            (function(global) {
                "use strict";
                var buffer = require("buffer"),
                    Buffer = buffer.Buffer,
                    SlowBuffer = buffer.SlowBuffer,
                    MAX_LEN = buffer.kMaxLength || 2147483647;
                exports.alloc = function(size, fill, encoding) {
                    if ("function" == typeof Buffer.alloc) return Buffer.alloc(size, fill, encoding);
                    if ("number" == typeof encoding) throw new TypeError("encoding must not be number");
                    if ("number" != typeof size) throw new TypeError("size must be a number");
                    if (size > MAX_LEN) throw new RangeError("size is too large");
                    var enc = encoding,
                        _fill = fill;
                    void 0 === _fill && (enc = void 0, _fill = 0);
                    var buf = new Buffer(size);
                    if ("string" == typeof _fill)
                        for (var fillBuf = new Buffer(_fill, enc), flen = fillBuf.length, i = -1; ++i < size;) buf[i] = fillBuf[i % flen];
                    else buf.fill(_fill);
                    return buf
                }, exports.allocUnsafe = function(size) {
                    if ("function" == typeof Buffer.allocUnsafe) return Buffer.allocUnsafe(size);
                    if ("number" != typeof size) throw new TypeError("size must be a number");
                    if (size > MAX_LEN) throw new RangeError("size is too large");
                    return new Buffer(size)
                }, exports.from = function(value, encodingOrOffset, length) {
                    if ("function" == typeof Buffer.from && (!global.Uint8Array || Uint8Array.from !== Buffer.from)) return Buffer.from(value, encodingOrOffset, length);
                    if ("number" == typeof value) throw new TypeError('"value" argument must not be a number');
                    if ("string" == typeof value) return new Buffer(value, encodingOrOffset);
                    if ("undefined" != typeof ArrayBuffer && value instanceof ArrayBuffer) {
                        var offset = encodingOrOffset;
                        if (1 === arguments.length) return new Buffer(value);
                        "undefined" == typeof offset && (offset = 0);
                        var len = length;
                        if ("undefined" == typeof len && (len = value.byteLength - offset), offset >= value.byteLength) throw new RangeError("'offset' is out of bounds");
                        if (len > value.byteLength - offset) throw new RangeError("'length' is out of bounds");
                        return new Buffer(value.slice(offset, offset + len))
                    }
                    if (Buffer.isBuffer(value)) {
                        var out = new Buffer(value.length);
                        return value.copy(out, 0, 0, value.length), out
                    }
                    if (value) {
                        if (Array.isArray(value) || "undefined" != typeof ArrayBuffer && value.buffer instanceof ArrayBuffer || "length" in value) return new Buffer(value);
                        if ("Buffer" === value.type && Array.isArray(value.data)) return new Buffer(value.data)
                    }
                    throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")
                }, exports.allocUnsafeSlow = function(size) {
                    if ("function" == typeof Buffer.allocUnsafeSlow) return Buffer.allocUnsafeSlow(size);
                    if ("number" != typeof size) throw new TypeError("size must be a number");
                    if (size >= MAX_LEN) throw new RangeError("size is too large");
                    return new SlowBuffer(size)
                }
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            buffer: 77
        }],
        77: [function(require, module, exports) {
            (function(global) {
                "use strict";

                function typedArraySupport() {
                    try {
                        var arr = new Uint8Array(1);
                        return arr.__proto__ = {
                            __proto__: Uint8Array.prototype,
                            foo: function() {
                                return 42
                            }
                        }, 42 === arr.foo() && "function" == typeof arr.subarray && 0 === arr.subarray(1, 1).byteLength
                    } catch (e) {
                        return !1
                    }
                }

                function kMaxLength() {
                    return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823
                }

                function createBuffer(that, length) {
                    if (kMaxLength() < length) throw new RangeError("Invalid typed array length");
                    return Buffer.TYPED_ARRAY_SUPPORT ? (that = new Uint8Array(length), that.__proto__ = Buffer.prototype) : (null === that && (that = new Buffer(length)), that.length = length), that
                }

                function Buffer(arg, encodingOrOffset, length) {
                    if (!(Buffer.TYPED_ARRAY_SUPPORT || this instanceof Buffer)) return new Buffer(arg, encodingOrOffset, length);
                    if ("number" == typeof arg) {
                        if ("string" == typeof encodingOrOffset) throw new Error("If encoding is specified then the first argument must be a string");
                        return allocUnsafe(this, arg)
                    }
                    return from(this, arg, encodingOrOffset, length)
                }

                function from(that, value, encodingOrOffset, length) {
                    if ("number" == typeof value) throw new TypeError('"value" argument must not be a number');
                    return "undefined" != typeof ArrayBuffer && value instanceof ArrayBuffer ? fromArrayBuffer(that, value, encodingOrOffset, length) : "string" == typeof value ? fromString(that, value, encodingOrOffset) : fromObject(that, value)
                }

                function assertSize(size) {
                    if ("number" != typeof size) throw new TypeError('"size" argument must be a number');
                    if (0 > size) throw new RangeError('"size" argument must not be negative')
                }

                function alloc(that, size, fill, encoding) {
                    return assertSize(size), 0 >= size ? createBuffer(that, size) : void 0 !== fill ? "string" == typeof encoding ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill) : createBuffer(that, size)
                }

                function allocUnsafe(that, size) {
                    if (assertSize(size), that = createBuffer(that, 0 > size ? 0 : 0 | checked(size)), !Buffer.TYPED_ARRAY_SUPPORT)
                        for (var i = 0; size > i; ++i) that[i] = 0;
                    return that
                }

                function fromString(that, string, encoding) {
                    if (("string" != typeof encoding || "" === encoding) && (encoding = "utf8"), !Buffer.isEncoding(encoding)) throw new TypeError('"encoding" must be a valid string encoding');
                    var length = 0 | byteLength(string, encoding);
                    that = createBuffer(that, length);
                    var actual = that.write(string, encoding);
                    return actual !== length && (that = that.slice(0, actual)), that
                }

                function fromArrayLike(that, array) {
                    var length = array.length < 0 ? 0 : 0 | checked(array.length);
                    that = createBuffer(that, length);
                    for (var i = 0; length > i; i += 1) that[i] = 255 & array[i];
                    return that
                }

                function fromArrayBuffer(that, array, byteOffset, length) {
                    if (array.byteLength, 0 > byteOffset || array.byteLength < byteOffset) throw new RangeError("'offset' is out of bounds");
                    if (array.byteLength < byteOffset + (length || 0)) throw new RangeError("'length' is out of bounds");
                    return array = void 0 === byteOffset && void 0 === length ? new Uint8Array(array) : void 0 === length ? new Uint8Array(array, byteOffset) : new Uint8Array(array, byteOffset, length), Buffer.TYPED_ARRAY_SUPPORT ? (that = array, that.__proto__ = Buffer.prototype) : that = fromArrayLike(that, array), that
                }

                function fromObject(that, obj) {
                    if (Buffer.isBuffer(obj)) {
                        var len = 0 | checked(obj.length);
                        return that = createBuffer(that, len), 0 === that.length ? that : (obj.copy(that, 0, 0, len), that)
                    }
                    if (obj) {
                        if ("undefined" != typeof ArrayBuffer && obj.buffer instanceof ArrayBuffer || "length" in obj) return "number" != typeof obj.length || isnan(obj.length) ? createBuffer(that, 0) : fromArrayLike(that, obj);
                        if ("Buffer" === obj.type && isArray(obj.data)) return fromArrayLike(that, obj.data)
                    }
                    throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")
                }

                function checked(length) {
                    if (length >= kMaxLength()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength().toString(16) + " bytes");
                    return 0 | length
                }

                function SlowBuffer(length) {
                    return +length != length && (length = 0), Buffer.alloc(+length)
                }

                function byteLength(string, encoding) {
                    if (Buffer.isBuffer(string)) return string.length;
                    if ("undefined" != typeof ArrayBuffer && "function" == typeof ArrayBuffer.isView && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) return string.byteLength;
                    "string" != typeof string && (string = "" + string);
                    var len = string.length;
                    if (0 === len) return 0;
                    for (var loweredCase = !1;;) switch (encoding) {
                        case "ascii":
                        case "latin1":
                        case "binary":
                            return len;
                        case "utf8":
                        case "utf-8":
                        case void 0:
                            return utf8ToBytes(string).length;
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return 2 * len;
                        case "hex":
                            return len >>> 1;
                        case "base64":
                            return base64ToBytes(string).length;
                        default:
                            if (loweredCase) return utf8ToBytes(string).length;
                            encoding = ("" + encoding).toLowerCase(), loweredCase = !0
                    }
                }

                function slowToString(encoding, start, end) {
                    var loweredCase = !1;
                    if ((void 0 === start || 0 > start) && (start = 0), start > this.length) return "";
                    if ((void 0 === end || end > this.length) && (end = this.length), 0 >= end) return "";
                    if (end >>>= 0, start >>>= 0, start >= end) return "";
                    for (encoding || (encoding = "utf8");;) switch (encoding) {
                        case "hex":
                            return hexSlice(this, start, end);
                        case "utf8":
                        case "utf-8":
                            return utf8Slice(this, start, end);
                        case "ascii":
                            return asciiSlice(this, start, end);
                        case "latin1":
                        case "binary":
                            return latin1Slice(this, start, end);
                        case "base64":
                            return base64Slice(this, start, end);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return utf16leSlice(this, start, end);
                        default:
                            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                            encoding = (encoding + "").toLowerCase(), loweredCase = !0
                    }
                }

                function swap(b, n, m) {
                    var i = b[n];
                    b[n] = b[m], b[m] = i
                }

                function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
                    if (0 === buffer.length) return -1;
                    if ("string" == typeof byteOffset ? (encoding = byteOffset, byteOffset = 0) : byteOffset > 2147483647 ? byteOffset = 2147483647 : -2147483648 > byteOffset && (byteOffset = -2147483648), byteOffset = +byteOffset, isNaN(byteOffset) && (byteOffset = dir ? 0 : buffer.length - 1), 0 > byteOffset && (byteOffset = buffer.length + byteOffset), byteOffset >= buffer.length) {
                        if (dir) return -1;
                        byteOffset = buffer.length - 1
                    } else if (0 > byteOffset) {
                        if (!dir) return -1;
                        byteOffset = 0
                    }
                    if ("string" == typeof val && (val = Buffer.from(val, encoding)), Buffer.isBuffer(val)) return 0 === val.length ? -1 : arrayIndexOf(buffer, val, byteOffset, encoding, dir);
                    if ("number" == typeof val) return val = 255 & val, Buffer.TYPED_ARRAY_SUPPORT && "function" == typeof Uint8Array.prototype.indexOf ? dir ? Uint8Array.prototype.indexOf.call(buffer, val, byteOffset) : Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset) : arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
                    throw new TypeError("val must be string, number or Buffer")
                }

                function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
                    function read(buf, i) {
                        return 1 === indexSize ? buf[i] : buf.readUInt16BE(i * indexSize)
                    }
                    var indexSize = 1,
                        arrLength = arr.length,
                        valLength = val.length;
                    if (void 0 !== encoding && (encoding = String(encoding).toLowerCase(), "ucs2" === encoding || "ucs-2" === encoding || "utf16le" === encoding || "utf-16le" === encoding)) {
                        if (arr.length < 2 || val.length < 2) return -1;
                        indexSize = 2, arrLength /= 2, valLength /= 2, byteOffset /= 2
                    }
                    var i;
                    if (dir) {
                        var foundIndex = -1;
                        for (i = byteOffset; arrLength > i; i++)
                            if (read(arr, i) === read(val, -1 === foundIndex ? 0 : i - foundIndex)) {
                                if (-1 === foundIndex && (foundIndex = i), i - foundIndex + 1 === valLength) return foundIndex * indexSize
                            } else -1 !== foundIndex && (i -= i - foundIndex), foundIndex = -1
                    } else
                        for (byteOffset + valLength > arrLength && (byteOffset = arrLength - valLength), i = byteOffset; i >= 0; i--) {
                            for (var found = !0, j = 0; valLength > j; j++)
                                if (read(arr, i + j) !== read(val, j)) {
                                    found = !1;
                                    break
                                } if (found) return i
                        }
                    return -1
                }

                function hexWrite(buf, string, offset, length) {
                    offset = Number(offset) || 0;
                    var remaining = buf.length - offset;
                    length ? (length = Number(length), length > remaining && (length = remaining)) : length = remaining;
                    var strLen = string.length;
                    if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
                    length > strLen / 2 && (length = strLen / 2);
                    for (var i = 0; length > i; ++i) {
                        var parsed = parseInt(string.substr(2 * i, 2), 16);
                        if (isNaN(parsed)) return i;
                        buf[offset + i] = parsed
                    }
                    return i
                }

                function utf8Write(buf, string, offset, length) {
                    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
                }

                function asciiWrite(buf, string, offset, length) {
                    return blitBuffer(asciiToBytes(string), buf, offset, length)
                }

                function latin1Write(buf, string, offset, length) {
                    return asciiWrite(buf, string, offset, length)
                }

                function base64Write(buf, string, offset, length) {
                    return blitBuffer(base64ToBytes(string), buf, offset, length)
                }

                function ucs2Write(buf, string, offset, length) {
                    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
                }

                function base64Slice(buf, start, end) {
                    return 0 === start && end === buf.length ? base64.fromByteArray(buf) : base64.fromByteArray(buf.slice(start, end))
                }

                function utf8Slice(buf, start, end) {
                    end = Math.min(buf.length, end);
                    for (var res = [], i = start; end > i;) {
                        var firstByte = buf[i],
                            codePoint = null,
                            bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
                        if (end >= i + bytesPerSequence) {
                            var secondByte, thirdByte, fourthByte, tempCodePoint;
                            switch (bytesPerSequence) {
                                case 1:
                                    128 > firstByte && (codePoint = firstByte);
                                    break;
                                case 2:
                                    secondByte = buf[i + 1], 128 === (192 & secondByte) && (tempCodePoint = (31 & firstByte) << 6 | 63 & secondByte, tempCodePoint > 127 && (codePoint = tempCodePoint));
                                    break;
                                case 3:
                                    secondByte = buf[i + 1], thirdByte = buf[i + 2], 128 === (192 & secondByte) && 128 === (192 & thirdByte) && (tempCodePoint = (15 & firstByte) << 12 | (63 & secondByte) << 6 | 63 & thirdByte, tempCodePoint > 2047 && (55296 > tempCodePoint || tempCodePoint > 57343) && (codePoint = tempCodePoint));
                                    break;
                                case 4:
                                    secondByte = buf[i + 1], thirdByte = buf[i + 2], fourthByte = buf[i + 3], 128 === (192 & secondByte) && 128 === (192 & thirdByte) && 128 === (192 & fourthByte) && (tempCodePoint = (15 & firstByte) << 18 | (63 & secondByte) << 12 | (63 & thirdByte) << 6 | 63 & fourthByte, tempCodePoint > 65535 && 1114112 > tempCodePoint && (codePoint = tempCodePoint))
                            }
                        }
                        null === codePoint ? (codePoint = 65533, bytesPerSequence = 1) : codePoint > 65535 && (codePoint -= 65536, res.push(codePoint >>> 10 & 1023 | 55296), codePoint = 56320 | 1023 & codePoint), res.push(codePoint), i += bytesPerSequence
                    }
                    return decodeCodePointsArray(res)
                }

                function decodeCodePointsArray(codePoints) {
                    var len = codePoints.length;
                    if (MAX_ARGUMENTS_LENGTH >= len) return String.fromCharCode.apply(String, codePoints);
                    for (var res = "", i = 0; len > i;) res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
                    return res
                }

                function asciiSlice(buf, start, end) {
                    var ret = "";
                    end = Math.min(buf.length, end);
                    for (var i = start; end > i; ++i) ret += String.fromCharCode(127 & buf[i]);
                    return ret
                }

                function latin1Slice(buf, start, end) {
                    var ret = "";
                    end = Math.min(buf.length, end);
                    for (var i = start; end > i; ++i) ret += String.fromCharCode(buf[i]);
                    return ret
                }

                function hexSlice(buf, start, end) {
                    var len = buf.length;
                    (!start || 0 > start) && (start = 0), (!end || 0 > end || end > len) && (end = len);
                    for (var out = "", i = start; end > i; ++i) out += toHex(buf[i]);
                    return out
                }

                function utf16leSlice(buf, start, end) {
                    for (var bytes = buf.slice(start, end), res = "", i = 0; i < bytes.length; i += 2) res += String.fromCharCode(bytes[i] + 256 * bytes[i + 1]);
                    return res
                }

                function checkOffset(offset, ext, length) {
                    if (offset % 1 !== 0 || 0 > offset) throw new RangeError("offset is not uint");
                    if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length")
                }

                function checkInt(buf, value, offset, ext, max, min) {
                    if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
                    if (value > max || min > value) throw new RangeError('"value" argument is out of bounds');
                    if (offset + ext > buf.length) throw new RangeError("Index out of range")
                }

                function objectWriteUInt16(buf, value, offset, littleEndian) {
                    0 > value && (value = 65535 + value + 1);
                    for (var i = 0, j = Math.min(buf.length - offset, 2); j > i; ++i) buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> 8 * (littleEndian ? i : 1 - i)
                }

                function objectWriteUInt32(buf, value, offset, littleEndian) {
                    0 > value && (value = 4294967295 + value + 1);
                    for (var i = 0, j = Math.min(buf.length - offset, 4); j > i; ++i) buf[offset + i] = value >>> 8 * (littleEndian ? i : 3 - i) & 255
                }

                function checkIEEE754(buf, value, offset, ext, max, min) {
                    if (offset + ext > buf.length) throw new RangeError("Index out of range");
                    if (0 > offset) throw new RangeError("Index out of range")
                }

                function writeFloat(buf, value, offset, littleEndian, noAssert) {
                    return noAssert || checkIEEE754(buf, value, offset, 4, 3.4028234663852886e38, -3.4028234663852886e38), ieee754.write(buf, value, offset, littleEndian, 23, 4), offset + 4
                }

                function writeDouble(buf, value, offset, littleEndian, noAssert) {
                    return noAssert || checkIEEE754(buf, value, offset, 8, 1.7976931348623157e308, -1.7976931348623157e308), ieee754.write(buf, value, offset, littleEndian, 52, 8), offset + 8
                }

                function base64clean(str) {
                    if (str = stringtrim(str).replace(INVALID_BASE64_RE, ""), str.length < 2) return "";
                    for (; str.length % 4 !== 0;) str += "=";
                    return str
                }

                function stringtrim(str) {
                    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "")
                }

                function toHex(n) {
                    return 16 > n ? "0" + n.toString(16) : n.toString(16)
                }

                function utf8ToBytes(string, units) {
                    units = units || 1 / 0;
                    for (var codePoint, length = string.length, leadSurrogate = null, bytes = [], i = 0; length > i; ++i) {
                        if (codePoint = string.charCodeAt(i), codePoint > 55295 && 57344 > codePoint) {
                            if (!leadSurrogate) {
                                if (codePoint > 56319) {
                                    (units -= 3) > -1 && bytes.push(239, 191, 189);
                                    continue
                                }
                                if (i + 1 === length) {
                                    (units -= 3) > -1 && bytes.push(239, 191, 189);
                                    continue
                                }
                                leadSurrogate = codePoint;
                                continue
                            }
                            if (56320 > codePoint) {
                                (units -= 3) > -1 && bytes.push(239, 191, 189), leadSurrogate = codePoint;
                                continue
                            }
                            codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536
                        } else leadSurrogate && (units -= 3) > -1 && bytes.push(239, 191, 189);
                        if (leadSurrogate = null, 128 > codePoint) {
                            if ((units -= 1) < 0) break;
                            bytes.push(codePoint)
                        } else if (2048 > codePoint) {
                            if ((units -= 2) < 0) break;
                            bytes.push(codePoint >> 6 | 192, 63 & codePoint | 128)
                        } else if (65536 > codePoint) {
                            if ((units -= 3) < 0) break;
                            bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, 63 & codePoint | 128)
                        } else {
                            if (!(1114112 > codePoint)) throw new Error("Invalid code point");
                            if ((units -= 4) < 0) break;
                            bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, 63 & codePoint | 128)
                        }
                    }
                    return bytes
                }

                function asciiToBytes(str) {
                    for (var byteArray = [], i = 0; i < str.length; ++i) byteArray.push(255 & str.charCodeAt(i));
                    return byteArray
                }

                function utf16leToBytes(str, units) {
                    for (var c, hi, lo, byteArray = [], i = 0; i < str.length && !((units -= 2) < 0); ++i) c = str.charCodeAt(i), hi = c >> 8, lo = c % 256, byteArray.push(lo), byteArray.push(hi);
                    return byteArray
                }

                function base64ToBytes(str) {
                    return base64.toByteArray(base64clean(str))
                }

                function blitBuffer(src, dst, offset, length) {
                    for (var i = 0; length > i && !(i + offset >= dst.length || i >= src.length); ++i) dst[i + offset] = src[i];
                    return i
                }

                function isnan(val) {
                    return val !== val
                }
                var base64 = require("base64-js"),
                    ieee754 = require("ieee754"),
                    isArray = require("isarray");
                exports.Buffer = Buffer, exports.SlowBuffer = SlowBuffer, exports.INSPECT_MAX_BYTES = 50, Buffer.TYPED_ARRAY_SUPPORT = void 0 !== global.TYPED_ARRAY_SUPPORT ? global.TYPED_ARRAY_SUPPORT : typedArraySupport(), exports.kMaxLength = kMaxLength(), Buffer.poolSize = 8192, Buffer._augment = function(arr) {
                    return arr.__proto__ = Buffer.prototype, arr
                }, Buffer.from = function(value, encodingOrOffset, length) {
                    return from(null, value, encodingOrOffset, length)
                }, Buffer.TYPED_ARRAY_SUPPORT && (Buffer.prototype.__proto__ = Uint8Array.prototype, Buffer.__proto__ = Uint8Array, "undefined" != typeof Symbol && Symbol.species && Buffer[Symbol.species] === Buffer && Object.defineProperty(Buffer, Symbol.species, {
                    value: null,
                    configurable: !0
                })), Buffer.alloc = function(size, fill, encoding) {
                    return alloc(null, size, fill, encoding)
                }, Buffer.allocUnsafe = function(size) {
                    return allocUnsafe(null, size)
                }, Buffer.allocUnsafeSlow = function(size) {
                    return allocUnsafe(null, size)
                }, Buffer.isBuffer = function(b) {
                    return !(null == b || !b._isBuffer)
                }, Buffer.compare = function(a, b) {
                    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) throw new TypeError("Arguments must be Buffers");
                    if (a === b) return 0;
                    for (var x = a.length, y = b.length, i = 0, len = Math.min(x, y); len > i; ++i)
                        if (a[i] !== b[i]) {
                            x = a[i], y = b[i];
                            break
                        } return y > x ? -1 : x > y ? 1 : 0
                }, Buffer.isEncoding = function(encoding) {
                    switch (String(encoding).toLowerCase()) {
                        case "hex":
                        case "utf8":
                        case "utf-8":
                        case "ascii":
                        case "latin1":
                        case "binary":
                        case "base64":
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return !0;
                        default:
                            return !1
                    }
                }, Buffer.concat = function(list, length) {
                    if (!isArray(list)) throw new TypeError('"list" argument must be an Array of Buffers');
                    if (0 === list.length) return Buffer.alloc(0);
                    var i;
                    if (void 0 === length)
                        for (length = 0, i = 0; i < list.length; ++i) length += list[i].length;
                    var buffer = Buffer.allocUnsafe(length),
                        pos = 0;
                    for (i = 0; i < list.length; ++i) {
                        var buf = list[i];
                        if (!Buffer.isBuffer(buf)) throw new TypeError('"list" argument must be an Array of Buffers');
                        buf.copy(buffer, pos), pos += buf.length
                    }
                    return buffer
                }, Buffer.byteLength = byteLength, Buffer.prototype._isBuffer = !0, Buffer.prototype.swap16 = function() {
                    var len = this.length;
                    if (len % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
                    for (var i = 0; len > i; i += 2) swap(this, i, i + 1);
                    return this
                }, Buffer.prototype.swap32 = function() {
                    var len = this.length;
                    if (len % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
                    for (var i = 0; len > i; i += 4) swap(this, i, i + 3), swap(this, i + 1, i + 2);
                    return this
                }, Buffer.prototype.swap64 = function() {
                    var len = this.length;
                    if (len % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
                    for (var i = 0; len > i; i += 8) swap(this, i, i + 7), swap(this, i + 1, i + 6), swap(this, i + 2, i + 5), swap(this, i + 3, i + 4);
                    return this
                }, Buffer.prototype.toString = function() {
                    var length = 0 | this.length;
                    return 0 === length ? "" : 0 === arguments.length ? utf8Slice(this, 0, length) : slowToString.apply(this, arguments)
                }, Buffer.prototype.equals = function(b) {
                    if (!Buffer.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
                    return this === b ? !0 : 0 === Buffer.compare(this, b)
                }, Buffer.prototype.inspect = function() {
                    var str = "",
                        max = exports.INSPECT_MAX_BYTES;
                    return this.length > 0 && (str = this.toString("hex", 0, max).match(/.{2}/g).join(" "), this.length > max && (str += " ... ")), "<Buffer " + str + ">"
                }, Buffer.prototype.compare = function(target, start, end, thisStart, thisEnd) {
                    if (!Buffer.isBuffer(target)) throw new TypeError("Argument must be a Buffer");
                    if (void 0 === start && (start = 0), void 0 === end && (end = target ? target.length : 0), void 0 === thisStart && (thisStart = 0), void 0 === thisEnd && (thisEnd = this.length), 0 > start || end > target.length || 0 > thisStart || thisEnd > this.length) throw new RangeError("out of range index");
                    if (thisStart >= thisEnd && start >= end) return 0;
                    if (thisStart >= thisEnd) return -1;
                    if (start >= end) return 1;
                    if (start >>>= 0, end >>>= 0, thisStart >>>= 0, thisEnd >>>= 0, this === target) return 0;
                    for (var x = thisEnd - thisStart, y = end - start, len = Math.min(x, y), thisCopy = this.slice(thisStart, thisEnd), targetCopy = target.slice(start, end), i = 0; len > i; ++i)
                        if (thisCopy[i] !== targetCopy[i]) {
                            x = thisCopy[i], y = targetCopy[i];
                            break
                        } return y > x ? -1 : x > y ? 1 : 0
                }, Buffer.prototype.includes = function(val, byteOffset, encoding) {
                    return -1 !== this.indexOf(val, byteOffset, encoding)
                }, Buffer.prototype.indexOf = function(val, byteOffset, encoding) {
                    return bidirectionalIndexOf(this, val, byteOffset, encoding, !0)
                }, Buffer.prototype.lastIndexOf = function(val, byteOffset, encoding) {
                    return bidirectionalIndexOf(this, val, byteOffset, encoding, !1)
                }, Buffer.prototype.write = function(string, offset, length, encoding) {
                    if (void 0 === offset) encoding = "utf8", length = this.length, offset = 0;
                    else if (void 0 === length && "string" == typeof offset) encoding = offset, length = this.length, offset = 0;
                    else {
                        if (!isFinite(offset)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
                        offset = 0 | offset, isFinite(length) ? (length = 0 | length, void 0 === encoding && (encoding = "utf8")) : (encoding = length, length = void 0)
                    }
                    var remaining = this.length - offset;
                    if ((void 0 === length || length > remaining) && (length = remaining), string.length > 0 && (0 > length || 0 > offset) || offset > this.length) throw new RangeError("Attempt to write outside buffer bounds");
                    encoding || (encoding = "utf8");
                    for (var loweredCase = !1;;) switch (encoding) {
                        case "hex":
                            return hexWrite(this, string, offset, length);
                        case "utf8":
                        case "utf-8":
                            return utf8Write(this, string, offset, length);
                        case "ascii":
                            return asciiWrite(this, string, offset, length);
                        case "latin1":
                        case "binary":
                            return latin1Write(this, string, offset, length);
                        case "base64":
                            return base64Write(this, string, offset, length);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return ucs2Write(this, string, offset, length);
                        default:
                            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                            encoding = ("" + encoding).toLowerCase(), loweredCase = !0
                    }
                }, Buffer.prototype.toJSON = function() {
                    return {
                        type: "Buffer",
                        data: Array.prototype.slice.call(this._arr || this, 0)
                    }
                };
                var MAX_ARGUMENTS_LENGTH = 4096;
                Buffer.prototype.slice = function(start, end) {
                    var len = this.length;
                    start = ~~start, end = void 0 === end ? len : ~~end, 0 > start ? (start += len, 0 > start && (start = 0)) : start > len && (start = len), 0 > end ? (end += len, 0 > end && (end = 0)) : end > len && (end = len), start > end && (end = start);
                    var newBuf;
                    if (Buffer.TYPED_ARRAY_SUPPORT) newBuf = this.subarray(start, end), newBuf.__proto__ = Buffer.prototype;
                    else {
                        var sliceLen = end - start;
                        newBuf = new Buffer(sliceLen, void 0);
                        for (var i = 0; sliceLen > i; ++i) newBuf[i] = this[i + start]
                    }
                    return newBuf
                }, Buffer.prototype.readUIntLE = function(offset, byteLength, noAssert) {
                    offset = 0 | offset, byteLength = 0 | byteLength, noAssert || checkOffset(offset, byteLength, this.length);
                    for (var val = this[offset], mul = 1, i = 0; ++i < byteLength && (mul *= 256);) val += this[offset + i] * mul;
                    return val
                }, Buffer.prototype.readUIntBE = function(offset, byteLength, noAssert) {
                    offset = 0 | offset, byteLength = 0 | byteLength, noAssert || checkOffset(offset, byteLength, this.length);
                    for (var val = this[offset + --byteLength], mul = 1; byteLength > 0 && (mul *= 256);) val += this[offset + --byteLength] * mul;
                    return val
                }, Buffer.prototype.readUInt8 = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 1, this.length), this[offset]
                }, Buffer.prototype.readUInt16LE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 2, this.length), this[offset] | this[offset + 1] << 8
                }, Buffer.prototype.readUInt16BE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 2, this.length), this[offset] << 8 | this[offset + 1]
                }, Buffer.prototype.readUInt32LE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 4, this.length), (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + 16777216 * this[offset + 3]
                }, Buffer.prototype.readUInt32BE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 4, this.length), 16777216 * this[offset] + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3])
                }, Buffer.prototype.readIntLE = function(offset, byteLength, noAssert) {
                    offset = 0 | offset, byteLength = 0 | byteLength, noAssert || checkOffset(offset, byteLength, this.length);
                    for (var val = this[offset], mul = 1, i = 0; ++i < byteLength && (mul *= 256);) val += this[offset + i] * mul;
                    return mul *= 128, val >= mul && (val -= Math.pow(2, 8 * byteLength)), val
                }, Buffer.prototype.readIntBE = function(offset, byteLength, noAssert) {
                    offset = 0 | offset, byteLength = 0 | byteLength, noAssert || checkOffset(offset, byteLength, this.length);
                    for (var i = byteLength, mul = 1, val = this[offset + --i]; i > 0 && (mul *= 256);) val += this[offset + --i] * mul;
                    return mul *= 128, val >= mul && (val -= Math.pow(2, 8 * byteLength)), val
                }, Buffer.prototype.readInt8 = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 1, this.length), 128 & this[offset] ? -1 * (255 - this[offset] + 1) : this[offset]
                }, Buffer.prototype.readInt16LE = function(offset, noAssert) {
                    noAssert || checkOffset(offset, 2, this.length);
                    var val = this[offset] | this[offset + 1] << 8;
                    return 32768 & val ? 4294901760 | val : val
                }, Buffer.prototype.readInt16BE = function(offset, noAssert) {
                    noAssert || checkOffset(offset, 2, this.length);
                    var val = this[offset + 1] | this[offset] << 8;
                    return 32768 & val ? 4294901760 | val : val
                }, Buffer.prototype.readInt32LE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 4, this.length), this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24
                }, Buffer.prototype.readInt32BE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 4, this.length), this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]
                }, Buffer.prototype.readFloatLE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 4, this.length), ieee754.read(this, offset, !0, 23, 4)
                }, Buffer.prototype.readFloatBE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 4, this.length), ieee754.read(this, offset, !1, 23, 4)
                }, Buffer.prototype.readDoubleLE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 8, this.length), ieee754.read(this, offset, !0, 52, 8)
                }, Buffer.prototype.readDoubleBE = function(offset, noAssert) {
                    return noAssert || checkOffset(offset, 8, this.length), ieee754.read(this, offset, !1, 52, 8)
                }, Buffer.prototype.writeUIntLE = function(value, offset, byteLength, noAssert) {
                    if (value = +value, offset = 0 | offset, byteLength = 0 | byteLength, !noAssert) {
                        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                        checkInt(this, value, offset, byteLength, maxBytes, 0)
                    }
                    var mul = 1,
                        i = 0;
                    for (this[offset] = 255 & value; ++i < byteLength && (mul *= 256);) this[offset + i] = value / mul & 255;
                    return offset + byteLength
                }, Buffer.prototype.writeUIntBE = function(value, offset, byteLength, noAssert) {
                    if (value = +value, offset = 0 | offset, byteLength = 0 | byteLength, !noAssert) {
                        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                        checkInt(this, value, offset, byteLength, maxBytes, 0)
                    }
                    var i = byteLength - 1,
                        mul = 1;
                    for (this[offset + i] = 255 & value; --i >= 0 && (mul *= 256);) this[offset + i] = value / mul & 255;
                    return offset + byteLength
                }, Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 1, 255, 0), Buffer.TYPED_ARRAY_SUPPORT || (value = Math.floor(value)), this[offset] = 255 & value, offset + 1
                }, Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 2, 65535, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = 255 & value, this[offset + 1] = value >>> 8) : objectWriteUInt16(this, value, offset, !0), offset + 2
                }, Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 2, 65535, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value >>> 8, this[offset + 1] = 255 & value) : objectWriteUInt16(this, value, offset, !1), offset + 2
                }, Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 4, 4294967295, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset + 3] = value >>> 24, this[offset + 2] = value >>> 16, this[offset + 1] = value >>> 8, this[offset] = 255 & value) : objectWriteUInt32(this, value, offset, !0), offset + 4
                }, Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 4, 4294967295, 0), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = 255 & value) : objectWriteUInt32(this, value, offset, !1), offset + 4
                }, Buffer.prototype.writeIntLE = function(value, offset, byteLength, noAssert) {
                    if (value = +value, offset = 0 | offset, !noAssert) {
                        var limit = Math.pow(2, 8 * byteLength - 1);
                        checkInt(this, value, offset, byteLength, limit - 1, -limit)
                    }
                    var i = 0,
                        mul = 1,
                        sub = 0;
                    for (this[offset] = 255 & value; ++i < byteLength && (mul *= 256);) 0 > value && 0 === sub && 0 !== this[offset + i - 1] && (sub = 1), this[offset + i] = (value / mul >> 0) - sub & 255;
                    return offset + byteLength
                }, Buffer.prototype.writeIntBE = function(value, offset, byteLength, noAssert) {
                    if (value = +value, offset = 0 | offset, !noAssert) {
                        var limit = Math.pow(2, 8 * byteLength - 1);
                        checkInt(this, value, offset, byteLength, limit - 1, -limit)
                    }
                    var i = byteLength - 1,
                        mul = 1,
                        sub = 0;
                    for (this[offset + i] = 255 & value; --i >= 0 && (mul *= 256);) 0 > value && 0 === sub && 0 !== this[offset + i + 1] && (sub = 1), this[offset + i] = (value / mul >> 0) - sub & 255;
                    return offset + byteLength
                }, Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 1, 127, -128), Buffer.TYPED_ARRAY_SUPPORT || (value = Math.floor(value)), 0 > value && (value = 255 + value + 1), this[offset] = 255 & value, offset + 1
                }, Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 2, 32767, -32768), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = 255 & value, this[offset + 1] = value >>> 8) : objectWriteUInt16(this, value, offset, !0), offset + 2
                }, Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 2, 32767, -32768), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value >>> 8, this[offset + 1] = 255 & value) : objectWriteUInt16(this, value, offset, !1), offset + 2
                }, Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 4, 2147483647, -2147483648), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = 255 & value, this[offset + 1] = value >>> 8, this[offset + 2] = value >>> 16, this[offset + 3] = value >>> 24) : objectWriteUInt32(this, value, offset, !0), offset + 4
                }, Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
                    return value = +value, offset = 0 | offset, noAssert || checkInt(this, value, offset, 4, 2147483647, -2147483648), 0 > value && (value = 4294967295 + value + 1), Buffer.TYPED_ARRAY_SUPPORT ? (this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = 255 & value) : objectWriteUInt32(this, value, offset, !1), offset + 4
                }, Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
                    return writeFloat(this, value, offset, !0, noAssert)
                }, Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
                    return writeFloat(this, value, offset, !1, noAssert)
                }, Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
                    return writeDouble(this, value, offset, !0, noAssert)
                }, Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
                    return writeDouble(this, value, offset, !1, noAssert)
                }, Buffer.prototype.copy = function(target, targetStart, start, end) {
                    if (start || (start = 0), end || 0 === end || (end = this.length), targetStart >= target.length && (targetStart = target.length), targetStart || (targetStart = 0), end > 0 && start > end && (end = start), end === start) return 0;
                    if (0 === target.length || 0 === this.length) return 0;
                    if (0 > targetStart) throw new RangeError("targetStart out of bounds");
                    if (0 > start || start >= this.length) throw new RangeError("sourceStart out of bounds");
                    if (0 > end) throw new RangeError("sourceEnd out of bounds");
                    end > this.length && (end = this.length), target.length - targetStart < end - start && (end = target.length - targetStart + start);
                    var i, len = end - start;
                    if (this === target && targetStart > start && end > targetStart)
                        for (i = len - 1; i >= 0; --i) target[i + targetStart] = this[i + start];
                    else if (1e3 > len || !Buffer.TYPED_ARRAY_SUPPORT)
                        for (i = 0; len > i; ++i) target[i + targetStart] = this[i + start];
                    else Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
                    return len
                }, Buffer.prototype.fill = function(val, start, end, encoding) {
                    if ("string" == typeof val) {
                        if ("string" == typeof start ? (encoding = start, start = 0, end = this.length) : "string" == typeof end && (encoding = end, end = this.length), 1 === val.length) {
                            var code = val.charCodeAt(0);
                            256 > code && (val = code)
                        }
                        if (void 0 !== encoding && "string" != typeof encoding) throw new TypeError("encoding must be a string");
                        if ("string" == typeof encoding && !Buffer.isEncoding(encoding)) throw new TypeError("Unknown encoding: " + encoding)
                    } else "number" == typeof val && (val = 255 & val);
                    if (0 > start || this.length < start || this.length < end) throw new RangeError("Out of range index");
                    if (start >= end) return this;
                    start >>>= 0, end = void 0 === end ? this.length : end >>> 0, val || (val = 0);
                    var i;
                    if ("number" == typeof val)
                        for (i = start; end > i; ++i) this[i] = val;
                    else {
                        var bytes = Buffer.isBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString()),
                            len = bytes.length;
                        for (i = 0; end - start > i; ++i) this[i + start] = bytes[i % len]
                    }
                    return this
                };
                var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            "base64-js": 39,
            ieee754: 80,
            isarray: 83
        }],
        78: [function(require, module, exports) {
            (function(Buffer) {
                function isArray(arg) {
                    return Array.isArray ? Array.isArray(arg) : "[object Array]" === objectToString(arg)
                }

                function isBoolean(arg) {
                    return "boolean" == typeof arg
                }

                function isNull(arg) {
                    return null === arg
                }

                function isNullOrUndefined(arg) {
                    return null == arg
                }

                function isNumber(arg) {
                    return "number" == typeof arg
                }

                function isString(arg) {
                    return "string" == typeof arg
                }

                function isSymbol(arg) {
                    return "symbol" == typeof arg
                }

                function isUndefined(arg) {
                    return void 0 === arg
                }

                function isRegExp(re) {
                    return "[object RegExp]" === objectToString(re)
                }

                function isObject(arg) {
                    return "object" == typeof arg && null !== arg
                }

                function isDate(d) {
                    return "[object Date]" === objectToString(d)
                }

                function isError(e) {
                    return "[object Error]" === objectToString(e) || e instanceof Error
                }

                function isFunction(arg) {
                    return "function" == typeof arg
                }

                function isPrimitive(arg) {
                    return null === arg || "boolean" == typeof arg || "number" == typeof arg || "string" == typeof arg || "symbol" == typeof arg || "undefined" == typeof arg
                }

                function objectToString(o) {
                    return Object.prototype.toString.call(o)
                }
                exports.isArray = isArray, exports.isBoolean = isBoolean, exports.isNull = isNull, exports.isNullOrUndefined = isNullOrUndefined, exports.isNumber = isNumber, exports.isString = isString, exports.isSymbol = isSymbol, exports.isUndefined = isUndefined, exports.isRegExp = isRegExp, exports.isObject = isObject, exports.isDate = isDate, exports.isError = isError, exports.isFunction = isFunction, exports.isPrimitive = isPrimitive, exports.isBuffer = Buffer.isBuffer
            }).call(this, {
                isBuffer: require("../../is-buffer/index.js")
            })
        }, {
            "../../is-buffer/index.js": 82
        }],
        79: [function(require, module, exports) {
            function EventEmitter() {
                this._events = this._events || {}, this._maxListeners = this._maxListeners || void 0
            }

            function isFunction(arg) {
                return "function" == typeof arg
            }

            function isNumber(arg) {
                return "number" == typeof arg
            }

            function isObject(arg) {
                return "object" == typeof arg && null !== arg
            }

            function isUndefined(arg) {
                return void 0 === arg
            }
            module.exports = EventEmitter, EventEmitter.EventEmitter = EventEmitter, EventEmitter.prototype._events = void 0, EventEmitter.prototype._maxListeners = void 0, EventEmitter.defaultMaxListeners = 10, EventEmitter.prototype.setMaxListeners = function(n) {
                if (!isNumber(n) || 0 > n || isNaN(n)) throw TypeError("n must be a positive number");
                return this._maxListeners = n, this
            }, EventEmitter.prototype.emit = function(type) {
                var er, handler, len, args, i, listeners;
                if (this._events || (this._events = {}), "error" === type && (!this._events.error || isObject(this._events.error) && !this._events.error.length)) {
                    if (er = arguments[1], er instanceof Error) throw er;
                    var err = new Error('Uncaught, unspecified "error" event. (' + er + ")");
                    throw err.context = er, err
                }
                if (handler = this._events[type], isUndefined(handler)) return !1;
                if (isFunction(handler)) switch (arguments.length) {
                    case 1:
                        handler.call(this);
                        break;
                    case 2:
                        handler.call(this, arguments[1]);
                        break;
                    case 3:
                        handler.call(this, arguments[1], arguments[2]);
                        break;
                    default:
                        args = Array.prototype.slice.call(arguments, 1), handler.apply(this, args)
                } else if (isObject(handler))
                    for (args = Array.prototype.slice.call(arguments, 1), listeners = handler.slice(), len = listeners.length, i = 0; len > i; i++) listeners[i].apply(this, args);
                return !0
            }, EventEmitter.prototype.addListener = function(type, listener) {
                var m;
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                return this._events || (this._events = {}), this._events.newListener && this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener), this._events[type] ? isObject(this._events[type]) ? this._events[type].push(listener) : this._events[type] = [this._events[type], listener] : this._events[type] = listener, isObject(this._events[type]) && !this._events[type].warned && (m = isUndefined(this._maxListeners) ? EventEmitter.defaultMaxListeners : this._maxListeners, m && m > 0 && this._events[type].length > m && (this._events[type].warned = !0, console.error("(node) warning: possible EventEmitter memory leak detected. %d listeners added. Use emitter.setMaxListeners() to increase limit.", this._events[type].length), "function" == typeof console.trace && console.trace())), this
            }, EventEmitter.prototype.on = EventEmitter.prototype.addListener, EventEmitter.prototype.once = function(type, listener) {
                function g() {
                    this.removeListener(type, g), fired || (fired = !0, listener.apply(this, arguments))
                }
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                var fired = !1;
                return g.listener = listener, this.on(type, g), this
            }, EventEmitter.prototype.removeListener = function(type, listener) {
                var list, position, length, i;
                if (!isFunction(listener)) throw TypeError("listener must be a function");
                if (!this._events || !this._events[type]) return this;
                if (list = this._events[type], length = list.length, position = -1, list === listener || isFunction(list.listener) && list.listener === listener) delete this._events[type], this._events.removeListener && this.emit("removeListener", type, listener);
                else if (isObject(list)) {
                    for (i = length; i-- > 0;)
                        if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                            position = i;
                            break
                        } if (0 > position) return this;
                    1 === list.length ? (list.length = 0, delete this._events[type]) : list.splice(position, 1), this._events.removeListener && this.emit("removeListener", type, listener)
                }
                return this
            }, EventEmitter.prototype.removeAllListeners = function(type) {
                var key, listeners;
                if (!this._events) return this;
                if (!this._events.removeListener) return 0 === arguments.length ? this._events = {} : this._events[type] && delete this._events[type], this;
                if (0 === arguments.length) {
                    for (key in this._events) "removeListener" !== key && this.removeAllListeners(key);
                    return this.removeAllListeners("removeListener"), this._events = {}, this
                }
                if (listeners = this._events[type], isFunction(listeners)) this.removeListener(type, listeners);
                else if (listeners)
                    for (; listeners.length;) this.removeListener(type, listeners[listeners.length - 1]);
                return delete this._events[type], this
            }, EventEmitter.prototype.listeners = function(type) {
                var ret;
                return ret = this._events && this._events[type] ? isFunction(this._events[type]) ? [this._events[type]] : this._events[type].slice() : []
            }, EventEmitter.prototype.listenerCount = function(type) {
                if (this._events) {
                    var evlistener = this._events[type];
                    if (isFunction(evlistener)) return 1;
                    if (evlistener) return evlistener.length
                }
                return 0
            }, EventEmitter.listenerCount = function(emitter, type) {
                return emitter.listenerCount(type)
            }
        }, {}],
        80: [function(require, module, exports) {
            exports.read = function(buffer, offset, isLE, mLen, nBytes) {
                var e, m, eLen = 8 * nBytes - mLen - 1,
                    eMax = (1 << eLen) - 1,
                    eBias = eMax >> 1,
                    nBits = -7,
                    i = isLE ? nBytes - 1 : 0,
                    d = isLE ? -1 : 1,
                    s = buffer[offset + i];
                for (i += d, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen; nBits > 0; e = 256 * e + buffer[offset + i], i += d, nBits -= 8);
                for (m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen; nBits > 0; m = 256 * m + buffer[offset + i], i += d, nBits -= 8);
                if (0 === e) e = 1 - eBias;
                else {
                    if (e === eMax) return m ? NaN : (s ? -1 : 1) * (1 / 0);
                    m += Math.pow(2, mLen), e -= eBias
                }
                return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
            }, exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
                var e, m, c, eLen = 8 * nBytes - mLen - 1,
                    eMax = (1 << eLen) - 1,
                    eBias = eMax >> 1,
                    rt = 23 === mLen ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                    i = isLE ? 0 : nBytes - 1,
                    d = isLE ? 1 : -1,
                    s = 0 > value || 0 === value && 0 > 1 / value ? 1 : 0;
                for (value = Math.abs(value), isNaN(value) || value === 1 / 0 ? (m = isNaN(value) ? 1 : 0, e = eMax) : (e = Math.floor(Math.log(value) / Math.LN2), value * (c = Math.pow(2, -e)) < 1 && (e--, c *= 2), value += e + eBias >= 1 ? rt / c : rt * Math.pow(2, 1 - eBias), value * c >= 2 && (e++, c /= 2), e + eBias >= eMax ? (m = 0, e = eMax) : e + eBias >= 1 ? (m = (value * c - 1) * Math.pow(2, mLen), e += eBias) : (m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen), e = 0)); mLen >= 8; buffer[offset + i] = 255 & m, i += d, m /= 256, mLen -= 8);
                for (e = e << mLen | m, eLen += mLen; eLen > 0; buffer[offset + i] = 255 & e, i += d, e /= 256, eLen -= 8);
                buffer[offset + i - d] |= 128 * s
            }
        }, {}],
        81: [function(require, module, exports) {
            "function" == typeof Object.create ? module.exports = function(ctor, superCtor) {
                ctor.super_ = superCtor, ctor.prototype = Object.create(superCtor.prototype, {
                    constructor: {
                        value: ctor,
                        enumerable: !1,
                        writable: !0,
                        configurable: !0
                    }
                })
            } : module.exports = function(ctor, superCtor) {
                ctor.super_ = superCtor;
                var TempCtor = function() {};
                TempCtor.prototype = superCtor.prototype, ctor.prototype = new TempCtor, ctor.prototype.constructor = ctor
            }
        }, {}],
        82: [function(require, module, exports) {
            function isBuffer(obj) {
                return !!obj.constructor && "function" == typeof obj.constructor.isBuffer && obj.constructor.isBuffer(obj)
            }

            function isSlowBuffer(obj) {
                return "function" == typeof obj.readFloatLE && "function" == typeof obj.slice && isBuffer(obj.slice(0, 0))
            }
            module.exports = function(obj) {
                return null != obj && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
            }
        }, {}],
        83: [function(require, module, exports) {
            var toString = {}.toString;
            module.exports = Array.isArray || function(arr) {
                return "[object Array]" == toString.call(arr)
            }
        }, {}],
        84: [function(require, module, exports) {
            "use strict";
            var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            exports.encode = function(input, utf8) {
                for (var chr1, chr2, chr3, enc1, enc2, enc3, enc4, output = "", i = 0; i < input.length;) chr1 = input.charCodeAt(i++), chr2 = input.charCodeAt(i++), chr3 = input.charCodeAt(i++), enc1 = chr1 >> 2, enc2 = (3 & chr1) << 4 | chr2 >> 4, enc3 = (15 & chr2) << 2 | chr3 >> 6, enc4 = 63 & chr3, isNaN(chr2) ? enc3 = enc4 = 64 : isNaN(chr3) && (enc4 = 64), output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
                return output
            }, exports.decode = function(input, utf8) {
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4, output = "",
                    i = 0;
                for (input = input.replace(/[^A-Za-z0-9\+\/\=]/g, ""); i < input.length;) enc1 = _keyStr.indexOf(input.charAt(i++)), enc2 = _keyStr.indexOf(input.charAt(i++)), enc3 = _keyStr.indexOf(input.charAt(i++)), enc4 = _keyStr.indexOf(input.charAt(i++)), chr1 = enc1 << 2 | enc2 >> 4, chr2 = (15 & enc2) << 4 | enc3 >> 2, chr3 = (3 & enc3) << 6 | enc4, output += String.fromCharCode(chr1), 64 != enc3 && (output += String.fromCharCode(chr2)), 64 != enc4 && (output += String.fromCharCode(chr3));
                return output
            }
        }, {}],
        85: [function(require, module, exports) {
            "use strict";

            function CompressedObject() {
                this.compressedSize = 0, this.uncompressedSize = 0, this.crc32 = 0, this.compressionMethod = null, this.compressedContent = null
            }
            CompressedObject.prototype = {
                getContent: function() {
                    return null
                },
                getCompressedContent: function() {
                    return null
                }
            }, module.exports = CompressedObject
        }, {}],
        86: [function(require, module, exports) {
            "use strict";
            exports.STORE = {
                magic: "\x00\x00",
                compress: function(content, compressionOptions) {
                    return content
                },
                uncompress: function(content) {
                    return content
                },
                compressInputType: null,
                uncompressInputType: null
            }, exports.DEFLATE = require("./flate")
        }, {
            "./flate": 91
        }],
        87: [function(require, module, exports) {
            "use strict";
            var utils = require("./utils"),
                table = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918e3, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117];
            module.exports = function(input, crc) {
                if ("undefined" == typeof input || !input.length) return 0;
                var isArray = "string" !== utils.getTypeOf(input);
                "undefined" == typeof crc && (crc = 0);
                var x = 0,
                    y = 0,
                    b = 0;
                crc = -1 ^ crc;
                for (var i = 0, iTop = input.length; iTop > i; i++) b = isArray ? input[i] : input.charCodeAt(i), y = 255 & (crc ^ b), x = table[y], crc = crc >>> 8 ^ x;
                return -1 ^ crc
            }
        }, {
            "./utils": 104
        }],
        88: [function(require, module, exports) {
            "use strict";

            function DataReader(data) {
                this.data = null, this.length = 0, this.index = 0
            }
            var utils = require("./utils");
            DataReader.prototype = {
                checkOffset: function(offset) {
                    this.checkIndex(this.index + offset)
                },
                checkIndex: function(newIndex) {
                    if (this.length < newIndex || 0 > newIndex) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?")
                },
                setIndex: function(newIndex) {
                    this.checkIndex(newIndex), this.index = newIndex
                },
                skip: function(n) {
                    this.setIndex(this.index + n)
                },
                byteAt: function(i) {},
                readInt: function(size) {
                    var i, result = 0;
                    for (this.checkOffset(size), i = this.index + size - 1; i >= this.index; i--) result = (result << 8) + this.byteAt(i);
                    return this.index += size, result
                },
                readString: function(size) {
                    return utils.transformTo("string", this.readData(size))
                },
                readData: function(size) {},
                lastIndexOfSignature: function(sig) {},
                readDate: function() {
                    var dostime = this.readInt(4);
                    return new Date((dostime >> 25 & 127) + 1980, (dostime >> 21 & 15) - 1, dostime >> 16 & 31, dostime >> 11 & 31, dostime >> 5 & 63, (31 & dostime) << 1)
                }
            }, module.exports = DataReader
        }, {
            "./utils": 104
        }],
        89: [function(require, module, exports) {
            "use strict";
            exports.base64 = !1, exports.binary = !1, exports.dir = !1, exports.createFolders = !1, exports.date = null, exports.compression = null, exports.compressionOptions = null, exports.comment = null, exports.unixPermissions = null, exports.dosPermissions = null
        }, {}],
        90: [function(require, module, exports) {
            "use strict";
            var utils = require("./utils");
            exports.string2binary = function(str) {
                return utils.string2binary(str)
            }, exports.string2Uint8Array = function(str) {
                return utils.transformTo("uint8array", str)
            }, exports.uint8Array2String = function(array) {
                return utils.transformTo("string", array)
            }, exports.string2Blob = function(str) {
                var buffer = utils.transformTo("arraybuffer", str);
                return utils.arrayBuffer2Blob(buffer)
            }, exports.arrayBuffer2Blob = function(buffer) {
                return utils.arrayBuffer2Blob(buffer)
            }, exports.transformTo = function(outputType, input) {
                return utils.transformTo(outputType, input)
            }, exports.getTypeOf = function(input) {
                return utils.getTypeOf(input)
            }, exports.checkSupport = function(type) {
                return utils.checkSupport(type)
            }, exports.MAX_VALUE_16BITS = utils.MAX_VALUE_16BITS, exports.MAX_VALUE_32BITS = utils.MAX_VALUE_32BITS, exports.pretty = function(str) {
                return utils.pretty(str)
            }, exports.findCompression = function(compressionMethod) {
                return utils.findCompression(compressionMethod)
            }, exports.isRegExp = function(object) {
                return utils.isRegExp(object)
            }
        }, {
            "./utils": 104
        }],
        91: [function(require, module, exports) {
            "use strict";
            var USE_TYPEDARRAY = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array,
                pako = require("pako");
            exports.uncompressInputType = USE_TYPEDARRAY ? "uint8array" : "array", exports.compressInputType = USE_TYPEDARRAY ? "uint8array" : "array", exports.magic = "\b\x00", exports.compress = function(input, compressionOptions) {
                return pako.deflateRaw(input, {
                    level: compressionOptions.level || -1
                })
            }, exports.uncompress = function(input) {
                return pako.inflateRaw(input)
            }
        }, {
            pako: 120
        }],
        92: [function(require, module, exports) {
            "use strict";

            function JSZip(data, options) {
                return this instanceof JSZip ? (this.files = {}, this.comment = null, this.root = "", data && this.load(data, options), void(this.clone = function() {
                    var newObj = new JSZip;
                    for (var i in this) "function" != typeof this[i] && (newObj[i] = this[i]);
                    return newObj
                })) : new JSZip(data, options)
            }
            var base64 = require("./base64");
            JSZip.prototype = require("./object"), JSZip.prototype.load = require("./load"), JSZip.support = require("./support"), JSZip.defaults = require("./defaults"), JSZip.utils = require("./deprecatedPublicUtils"), JSZip.base64 = {
                encode: function(input) {
                    return base64.encode(input)
                },
                decode: function(input) {
                    return base64.decode(input)
                }
            }, JSZip.compressions = require("./compressions"), module.exports = JSZip
        }, {
            "./base64": 84,
            "./compressions": 86,
            "./defaults": 89,
            "./deprecatedPublicUtils": 90,
            "./load": 93,
            "./object": 96,
            "./support": 100
        }],
        93: [function(require, module, exports) {
            "use strict";
            var base64 = require("./base64"),
                ZipEntries = require("./zipEntries");
            module.exports = function(data, options) {
                var files, zipEntries, i, input;
                for (options = options || {}, options.base64 && (data = base64.decode(data)), zipEntries = new ZipEntries(data, options), files = zipEntries.files, i = 0; i < files.length; i++) input = files[i], this.file(input.fileName, input.decompressed, {
                    binary: !0,
                    optimizedBinaryString: !0,
                    date: input.date,
                    dir: input.dir,
                    comment: input.fileComment.length ? input.fileComment : null,
                    unixPermissions: input.unixPermissions,
                    dosPermissions: input.dosPermissions,
                    createFolders: options.createFolders
                });
                return zipEntries.zipComment.length && (this.comment = zipEntries.zipComment), this
            }
        }, {
            "./base64": 84,
            "./zipEntries": 105
        }],
        94: [function(require, module, exports) {
            (function(Buffer) {
                "use strict";
                module.exports = function(data, encoding) {
                    return new Buffer(data, encoding)
                }, module.exports.test = function(b) {
                    return Buffer.isBuffer(b)
                }
            }).call(this, require("buffer").Buffer)
        }, {
            buffer: 77
        }],
        95: [function(require, module, exports) {
            "use strict";

            function NodeBufferReader(data) {
                this.data = data, this.length = this.data.length, this.index = 0
            }
            var Uint8ArrayReader = require("./uint8ArrayReader");
            NodeBufferReader.prototype = new Uint8ArrayReader, NodeBufferReader.prototype.readData = function(size) {
                this.checkOffset(size);
                var result = this.data.slice(this.index, this.index + size);
                return this.index += size, result
            }, module.exports = NodeBufferReader
        }, {
            "./uint8ArrayReader": 101
        }],
        96: [function(require, module, exports) {
            "use strict";
            var support = require("./support"),
                utils = require("./utils"),
                crc32 = require("./crc32"),
                signature = require("./signature"),
                defaults = require("./defaults"),
                base64 = require("./base64"),
                compressions = require("./compressions"),
                CompressedObject = require("./compressedObject"),
                nodeBuffer = require("./nodeBuffer"),
                utf8 = require("./utf8"),
                StringWriter = require("./stringWriter"),
                Uint8ArrayWriter = require("./uint8ArrayWriter"),
                getRawData = function(file) {
                    if (file._data instanceof CompressedObject && (file._data = file._data.getContent(), file.options.binary = !0, file.options.base64 = !1, "uint8array" === utils.getTypeOf(file._data))) {
                        var copy = file._data;
                        file._data = new Uint8Array(copy.length), 0 !== copy.length && file._data.set(copy, 0)
                    }
                    return file._data
                },
                getBinaryData = function(file) {
                    var result = getRawData(file),
                        type = utils.getTypeOf(result);
                    return "string" === type ? !file.options.binary && support.nodebuffer ? nodeBuffer(result, "utf-8") : file.asBinary() : result
                },
                dataToString = function(asUTF8) {
                    var result = getRawData(this);
                    return null === result || "undefined" == typeof result ? "" : (this.options.base64 && (result = base64.decode(result)), result = asUTF8 && this.options.binary ? out.utf8decode(result) : utils.transformTo("string", result), asUTF8 || this.options.binary || (result = utils.transformTo("string", out.utf8encode(result))), result)
                },
                ZipObject = function(name, data, options) {
                    this.name = name, this.dir = options.dir, this.date = options.date, this.comment = options.comment, this.unixPermissions = options.unixPermissions, this.dosPermissions = options.dosPermissions, this._data = data, this.options = options, this._initialMetadata = {
                        dir: options.dir,
                        date: options.date
                    }
                };
            ZipObject.prototype = {
                asText: function() {
                    return dataToString.call(this, !0)
                },
                asBinary: function() {
                    return dataToString.call(this, !1)
                },
                asNodeBuffer: function() {
                    var result = getBinaryData(this);
                    return utils.transformTo("nodebuffer", result)
                },
                asUint8Array: function() {
                    var result = getBinaryData(this);
                    return utils.transformTo("uint8array", result)
                },
                asArrayBuffer: function() {
                    return this.asUint8Array().buffer
                }
            };
            var decToHex = function(dec, bytes) {
                    var i, hex = "";
                    for (i = 0; bytes > i; i++) hex += String.fromCharCode(255 & dec), dec >>>= 8;
                    return hex
                },
                extend = function() {
                    var i, attr, result = {};
                    for (i = 0; i < arguments.length; i++)
                        for (attr in arguments[i]) arguments[i].hasOwnProperty(attr) && "undefined" == typeof result[attr] && (result[attr] = arguments[i][attr]);
                    return result
                },
                prepareFileAttrs = function(o) {
                    return o = o || {}, o.base64 !== !0 || null !== o.binary && void 0 !== o.binary || (o.binary = !0), o = extend(o, defaults), o.date = o.date || new Date, null !== o.compression && (o.compression = o.compression.toUpperCase()), o
                },
                fileAdd = function(name, data, o) {
                    var parent, dataType = utils.getTypeOf(data);
                    if (o = prepareFileAttrs(o), "string" == typeof o.unixPermissions && (o.unixPermissions = parseInt(o.unixPermissions, 8)), o.unixPermissions && 16384 & o.unixPermissions && (o.dir = !0), o.dosPermissions && 16 & o.dosPermissions && (o.dir = !0), o.dir && (name = forceTrailingSlash(name)), o.createFolders && (parent = parentFolder(name)) && folderAdd.call(this, parent, !0), o.dir || null === data || "undefined" == typeof data) o.base64 = !1, o.binary = !1, data = null, dataType = null;
                    else if ("string" === dataType) o.binary && !o.base64 && o.optimizedBinaryString !== !0 && (data = utils.string2binary(data));
                    else {
                        if (o.base64 = !1, o.binary = !0, !(dataType || data instanceof CompressedObject)) throw new Error("The data of '" + name + "' is in an unsupported format !");
                        "arraybuffer" === dataType && (data = utils.transformTo("uint8array", data))
                    }
                    var object = new ZipObject(name, data, o);
                    return this.files[name] = object, object
                },
                parentFolder = function(path) {
                    "/" == path.slice(-1) && (path = path.substring(0, path.length - 1));
                    var lastSlash = path.lastIndexOf("/");
                    return lastSlash > 0 ? path.substring(0, lastSlash) : ""
                },
                forceTrailingSlash = function(path) {
                    return "/" != path.slice(-1) && (path += "/"), path
                },
                folderAdd = function(name, createFolders) {
                    return createFolders = "undefined" != typeof createFolders ? createFolders : !1, name = forceTrailingSlash(name), this.files[name] || fileAdd.call(this, name, null, {
                        dir: !0,
                        createFolders: createFolders
                    }), this.files[name]
                },
                generateCompressedObjectFrom = function(file, compression, compressionOptions) {
                    var content, result = new CompressedObject;
                    return file._data instanceof CompressedObject ? (result.uncompressedSize = file._data.uncompressedSize, result.crc32 = file._data.crc32, 0 === result.uncompressedSize || file.dir ? (compression = compressions.STORE, result.compressedContent = "", result.crc32 = 0) : file._data.compressionMethod === compression.magic ? result.compressedContent = file._data.getCompressedContent() : (content = file._data.getContent(), result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions))) : (content = getBinaryData(file), (!content || 0 === content.length || file.dir) && (compression = compressions.STORE, content = ""), result.uncompressedSize = content.length, result.crc32 = crc32(content), result.compressedContent = compression.compress(utils.transformTo(compression.compressInputType, content), compressionOptions)), result.compressedSize = result.compressedContent.length, result.compressionMethod = compression.magic, result
                },
                generateUnixExternalFileAttr = function(unixPermissions, isDir) {
                    var result = unixPermissions;
                    return unixPermissions || (result = isDir ? 16893 : 33204), (65535 & result) << 16
                },
                generateDosExternalFileAttr = function(dosPermissions, isDir) {
                    return 63 & (dosPermissions || 0)
                },
                generateZipParts = function(name, file, compressedObject, offset, platform) {
                    var dosTime, dosDate, dir, date, utfEncodedFileName = (compressedObject.compressedContent, utils.transformTo("string", utf8.utf8encode(file.name))),
                        comment = file.comment || "",
                        utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)),
                        useUTF8ForFileName = utfEncodedFileName.length !== file.name.length,
                        useUTF8ForComment = utfEncodedComment.length !== comment.length,
                        o = file.options,
                        extraFields = "",
                        unicodePathExtraField = "",
                        unicodeCommentExtraField = "";
                    dir = file._initialMetadata.dir !== file.dir ? file.dir : o.dir, date = file._initialMetadata.date !== file.date ? file.date : o.date;
                    var extFileAttr = 0,
                        versionMadeBy = 0;
                    dir && (extFileAttr |= 16), "UNIX" === platform ? (versionMadeBy = 798, extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir)) : (versionMadeBy = 20, extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir)), dosTime = date.getHours(), dosTime <<= 6, dosTime |= date.getMinutes(), dosTime <<= 5, dosTime |= date.getSeconds() / 2, dosDate = date.getFullYear() - 1980, dosDate <<= 4, dosDate |= date.getMonth() + 1, dosDate <<= 5, dosDate |= date.getDate(), useUTF8ForFileName && (unicodePathExtraField = decToHex(1, 1) + decToHex(crc32(utfEncodedFileName), 4) + utfEncodedFileName, extraFields += "up" + decToHex(unicodePathExtraField.length, 2) + unicodePathExtraField), useUTF8ForComment && (unicodeCommentExtraField = decToHex(1, 1) + decToHex(this.crc32(utfEncodedComment), 4) + utfEncodedComment, extraFields += "uc" + decToHex(unicodeCommentExtraField.length, 2) + unicodeCommentExtraField);
                    var header = "";
                    header += "\n\x00", header += useUTF8ForFileName || useUTF8ForComment ? "\x00\b" : "\x00\x00", header += compressedObject.compressionMethod, header += decToHex(dosTime, 2), header += decToHex(dosDate, 2), header += decToHex(compressedObject.crc32, 4), header += decToHex(compressedObject.compressedSize, 4), header += decToHex(compressedObject.uncompressedSize, 4), header += decToHex(utfEncodedFileName.length, 2), header += decToHex(extraFields.length, 2);
                    var fileRecord = signature.LOCAL_FILE_HEADER + header + utfEncodedFileName + extraFields,
                        dirRecord = signature.CENTRAL_FILE_HEADER + decToHex(versionMadeBy, 2) + header + decToHex(utfEncodedComment.length, 2) + "\x00\x00\x00\x00" + decToHex(extFileAttr, 4) + decToHex(offset, 4) + utfEncodedFileName + extraFields + utfEncodedComment;
                    return {
                        fileRecord: fileRecord,
                        dirRecord: dirRecord,
                        compressedObject: compressedObject
                    }
                },
                out = {
                    load: function(stream, options) {
                        throw new Error("Load method is not defined. Is the file jszip-load.js included ?")
                    },
                    filter: function(search) {
                        var filename, relativePath, file, fileClone, result = [];
                        for (filename in this.files) this.files.hasOwnProperty(filename) && (file = this.files[filename], fileClone = new ZipObject(file.name, file._data, extend(file.options)), relativePath = filename.slice(this.root.length, filename.length), filename.slice(0, this.root.length) === this.root && search(relativePath, fileClone) && result.push(fileClone));
                        return result
                    },
                    file: function(name, data, o) {
                        if (1 === arguments.length) {
                            if (utils.isRegExp(name)) {
                                var regexp = name;
                                return this.filter(function(relativePath, file) {
                                    return !file.dir && regexp.test(relativePath)
                                })
                            }
                            return this.filter(function(relativePath, file) {
                                return !file.dir && relativePath === name
                            })[0] || null
                        }
                        return name = this.root + name, fileAdd.call(this, name, data, o), this
                    },
                    folder: function(arg) {
                        if (!arg) return this;
                        if (utils.isRegExp(arg)) return this.filter(function(relativePath, file) {
                            return file.dir && arg.test(relativePath)
                        });
                        var name = this.root + arg,
                            newFolder = folderAdd.call(this, name),
                            ret = this.clone();
                        return ret.root = newFolder.name, ret
                    },
                    remove: function(name) {
                        name = this.root + name;
                        var file = this.files[name];
                        if (file || ("/" != name.slice(-1) && (name += "/"), file = this.files[name]), file && !file.dir) delete this.files[name];
                        else
                            for (var kids = this.filter(function(relativePath, file) {
                                    return file.name.slice(0, name.length) === name
                                }), i = 0; i < kids.length; i++) delete this.files[kids[i].name];
                        return this
                    },
                    generate: function(options) {
                        options = extend(options || {}, {
                            base64: !0,
                            compression: "STORE",
                            compressionOptions: null,
                            type: "base64",
                            platform: "DOS",
                            comment: null,
                            mimeType: "application/zip"
                        }), utils.checkSupport(options.type), ("darwin" === options.platform || "freebsd" === options.platform || "linux" === options.platform || "sunos" === options.platform) && (options.platform = "UNIX"), "win32" === options.platform && (options.platform = "DOS");
                        var writer, i, zipData = [],
                            localDirLength = 0,
                            centralDirLength = 0,
                            utfEncodedComment = utils.transformTo("string", this.utf8encode(options.comment || this.comment || ""));
                        for (var name in this.files)
                            if (this.files.hasOwnProperty(name)) {
                                var file = this.files[name],
                                    compressionName = file.options.compression || options.compression.toUpperCase(),
                                    compression = compressions[compressionName];
                                if (!compression) throw new Error(compressionName + " is not a valid compression method !");
                                var compressionOptions = file.options.compressionOptions || options.compressionOptions || {},
                                    compressedObject = generateCompressedObjectFrom.call(this, file, compression, compressionOptions),
                                    zipPart = generateZipParts.call(this, name, file, compressedObject, localDirLength, options.platform);
                                localDirLength += zipPart.fileRecord.length + compressedObject.compressedSize, centralDirLength += zipPart.dirRecord.length, zipData.push(zipPart)
                            } var dirEnd = "";
                        dirEnd = signature.CENTRAL_DIRECTORY_END + "\x00\x00\x00\x00" + decToHex(zipData.length, 2) + decToHex(zipData.length, 2) + decToHex(centralDirLength, 4) + decToHex(localDirLength, 4) + decToHex(utfEncodedComment.length, 2) + utfEncodedComment;
                        var typeName = options.type.toLowerCase();
                        for (writer = "uint8array" === typeName || "arraybuffer" === typeName || "blob" === typeName || "nodebuffer" === typeName ? new Uint8ArrayWriter(localDirLength + centralDirLength + dirEnd.length) : new StringWriter(localDirLength + centralDirLength + dirEnd.length), i = 0; i < zipData.length; i++) writer.append(zipData[i].fileRecord), writer.append(zipData[i].compressedObject.compressedContent);
                        for (i = 0; i < zipData.length; i++) writer.append(zipData[i].dirRecord);
                        writer.append(dirEnd);
                        var zip = writer.finalize();
                        switch (options.type.toLowerCase()) {
                            case "uint8array":
                            case "arraybuffer":
                            case "nodebuffer":
                                return utils.transformTo(options.type.toLowerCase(), zip);
                            case "blob":
                                return utils.arrayBuffer2Blob(utils.transformTo("arraybuffer", zip), options.mimeType);
                            case "base64":
                                return options.base64 ? base64.encode(zip) : zip;
                            default:
                                return zip
                        }
                    },
                    crc32: function(input, crc) {
                        return crc32(input, crc)
                    },
                    utf8encode: function(string) {
                        return utils.transformTo("string", utf8.utf8encode(string))
                    },
                    utf8decode: function(input) {
                        return utf8.utf8decode(input)
                    }
                };
            module.exports = out
        }, {
            "./base64": 84,
            "./compressedObject": 85,
            "./compressions": 86,
            "./crc32": 87,
            "./defaults": 89,
            "./nodeBuffer": 94,
            "./signature": 97,
            "./stringWriter": 99,
            "./support": 100,
            "./uint8ArrayWriter": 102,
            "./utf8": 103,
            "./utils": 104
        }],
        97: [function(require, module, exports) {
            "use strict";
            exports.LOCAL_FILE_HEADER = "PK", exports.CENTRAL_FILE_HEADER = "PK", exports.CENTRAL_DIRECTORY_END = "PK", exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK", exports.ZIP64_CENTRAL_DIRECTORY_END = "PK", exports.DATA_DESCRIPTOR = "PK\b"
        }, {}],
        98: [function(require, module, exports) {
            "use strict";

            function StringReader(data, optimizedBinaryString) {
                this.data = data, optimizedBinaryString || (this.data = utils.string2binary(this.data)), this.length = this.data.length, this.index = 0
            }
            var DataReader = require("./dataReader"),
                utils = require("./utils");
            StringReader.prototype = new DataReader, StringReader.prototype.byteAt = function(i) {
                return this.data.charCodeAt(i)
            }, StringReader.prototype.lastIndexOfSignature = function(sig) {
                return this.data.lastIndexOf(sig)
            }, StringReader.prototype.readData = function(size) {
                this.checkOffset(size);
                var result = this.data.slice(this.index, this.index + size);
                return this.index += size, result
            }, module.exports = StringReader
        }, {
            "./dataReader": 88,
            "./utils": 104
        }],
        99: [function(require, module, exports) {
            "use strict";
            var utils = require("./utils"),
                StringWriter = function() {
                    this.data = []
                };
            StringWriter.prototype = {
                append: function(input) {
                    input = utils.transformTo("string", input), this.data.push(input)
                },
                finalize: function() {
                    return this.data.join("")
                }
            }, module.exports = StringWriter
        }, {
            "./utils": 104
        }],
        100: [function(require, module, exports) {
            (function(Buffer) {
                "use strict";
                if (exports.base64 = !0, exports.array = !0, exports.string = !0, exports.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, exports.nodebuffer = "undefined" != typeof Buffer, exports.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) exports.blob = !1;
                else {
                    var buffer = new ArrayBuffer(0);
                    try {
                        exports.blob = 0 === new Blob([buffer], {
                            type: "application/zip"
                        }).size
                    } catch (e) {
                        try {
                            var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder,
                                builder = new Builder;
                            builder.append(buffer), exports.blob = 0 === builder.getBlob("application/zip").size
                        } catch (e) {
                            exports.blob = !1
                        }
                    }
                }
            }).call(this, require("buffer").Buffer)
        }, {
            buffer: 77
        }],
        101: [function(require, module, exports) {
            "use strict";

            function Uint8ArrayReader(data) {
                data && (this.data = data, this.length = this.data.length, this.index = 0)
            }
            var DataReader = require("./dataReader");
            Uint8ArrayReader.prototype = new DataReader, Uint8ArrayReader.prototype.byteAt = function(i) {
                return this.data[i]
            }, Uint8ArrayReader.prototype.lastIndexOfSignature = function(sig) {
                for (var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), i = this.length - 4; i >= 0; --i)
                    if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) return i;
                return -1
            }, Uint8ArrayReader.prototype.readData = function(size) {
                if (this.checkOffset(size), 0 === size) return new Uint8Array(0);
                var result = this.data.subarray(this.index, this.index + size);
                return this.index += size, result
            }, module.exports = Uint8ArrayReader
        }, {
            "./dataReader": 88
        }],
        102: [function(require, module, exports) {
            "use strict";
            var utils = require("./utils"),
                Uint8ArrayWriter = function(length) {
                    this.data = new Uint8Array(length), this.index = 0
                };
            Uint8ArrayWriter.prototype = {
                append: function(input) {
                    0 !== input.length && (input = utils.transformTo("uint8array", input), this.data.set(input, this.index), this.index += input.length)
                },
                finalize: function() {
                    return this.data
                }
            }, module.exports = Uint8ArrayWriter
        }, {
            "./utils": 104
        }],
        103: [function(require, module, exports) {
            "use strict";
            for (var utils = require("./utils"), support = require("./support"), nodeBuffer = require("./nodeBuffer"), _utf8len = new Array(256), i = 0; 256 > i; i++) _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
            _utf8len[254] = _utf8len[254] = 1;
            var string2buf = function(str) {
                    var buf, c, c2, m_pos, i, str_len = str.length,
                        buf_len = 0;
                    for (m_pos = 0; str_len > m_pos; m_pos++) c = str.charCodeAt(m_pos), 55296 === (64512 & c) && str_len > m_pos + 1 && (c2 = str.charCodeAt(m_pos + 1), 56320 === (64512 & c2) && (c = 65536 + (c - 55296 << 10) + (c2 - 56320), m_pos++)), buf_len += 128 > c ? 1 : 2048 > c ? 2 : 65536 > c ? 3 : 4;
                    for (buf = support.uint8array ? new Uint8Array(buf_len) : new Array(buf_len), i = 0, m_pos = 0; buf_len > i; m_pos++) c = str.charCodeAt(m_pos), 55296 === (64512 & c) && str_len > m_pos + 1 && (c2 = str.charCodeAt(m_pos + 1), 56320 === (64512 & c2) && (c = 65536 + (c - 55296 << 10) + (c2 - 56320), m_pos++)), 128 > c ? buf[i++] = c : 2048 > c ? (buf[i++] = 192 | c >>> 6, buf[i++] = 128 | 63 & c) : 65536 > c ? (buf[i++] = 224 | c >>> 12, buf[i++] = 128 | c >>> 6 & 63, buf[i++] = 128 | 63 & c) : (buf[i++] = 240 | c >>> 18, buf[i++] = 128 | c >>> 12 & 63, buf[i++] = 128 | c >>> 6 & 63, buf[i++] = 128 | 63 & c);
                    return buf
                },
                utf8border = function(buf, max) {
                    var pos;
                    for (max = max || buf.length, max > buf.length && (max = buf.length), pos = max - 1; pos >= 0 && 128 === (192 & buf[pos]);) pos--;
                    return 0 > pos ? max : 0 === pos ? max : pos + _utf8len[buf[pos]] > max ? pos : max
                },
                buf2string = function(buf) {
                    var i, out, c, c_len, len = buf.length,
                        utf16buf = new Array(2 * len);
                    for (out = 0, i = 0; len > i;)
                        if (c = buf[i++], 128 > c) utf16buf[out++] = c;
                        else if (c_len = _utf8len[c], c_len > 4) utf16buf[out++] = 65533, i += c_len - 1;
                    else {
                        for (c &= 2 === c_len ? 31 : 3 === c_len ? 15 : 7; c_len > 1 && len > i;) c = c << 6 | 63 & buf[i++], c_len--;
                        c_len > 1 ? utf16buf[out++] = 65533 : 65536 > c ? utf16buf[out++] = c : (c -= 65536, utf16buf[out++] = 55296 | c >> 10 & 1023, utf16buf[out++] = 56320 | 1023 & c)
                    }
                    return utf16buf.length !== out && (utf16buf.subarray ? utf16buf = utf16buf.subarray(0, out) : utf16buf.length = out), utils.applyFromCharCode(utf16buf)
                };
            exports.utf8encode = function(str) {
                return support.nodebuffer ? nodeBuffer(str, "utf-8") : string2buf(str)
            }, exports.utf8decode = function(buf) {
                if (support.nodebuffer) return utils.transformTo("nodebuffer", buf).toString("utf-8");
                buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);
                for (var result = [], k = 0, len = buf.length, chunk = 65536; len > k;) {
                    var nextBoundary = utf8border(buf, Math.min(k + chunk, len));
                    support.uint8array ? result.push(buf2string(buf.subarray(k, nextBoundary))) : result.push(buf2string(buf.slice(k, nextBoundary))), k = nextBoundary
                }
                return result.join("")
            }
        }, {
            "./nodeBuffer": 94,
            "./support": 100,
            "./utils": 104
        }],
        104: [function(require, module, exports) {
            "use strict";

            function identity(input) {
                return input
            }

            function stringToArrayLike(str, array) {
                for (var i = 0; i < str.length; ++i) array[i] = 255 & str.charCodeAt(i);
                return array
            }

            function arrayLikeToString(array) {
                var chunk = 65536,
                    result = [],
                    len = array.length,
                    type = exports.getTypeOf(array),
                    k = 0,
                    canUseApply = !0;
                try {
                    switch (type) {
                        case "uint8array":
                            String.fromCharCode.apply(null, new Uint8Array(0));
                            break;
                        case "nodebuffer":
                            String.fromCharCode.apply(null, nodeBuffer(0))
                    }
                } catch (e) {
                    canUseApply = !1
                }
                if (!canUseApply) {
                    for (var resultStr = "", i = 0; i < array.length; i++) resultStr += String.fromCharCode(array[i]);
                    return resultStr
                }
                for (; len > k && chunk > 1;) try {
                    "array" === type || "nodebuffer" === type ? result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len)))) : result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len)))), k += chunk
                } catch (e) {
                    chunk = Math.floor(chunk / 2)
                }
                return result.join("")
            }

            function arrayLikeToArrayLike(arrayFrom, arrayTo) {
                for (var i = 0; i < arrayFrom.length; i++) arrayTo[i] = arrayFrom[i];
                return arrayTo
            }
            var support = require("./support"),
                compressions = require("./compressions"),
                nodeBuffer = require("./nodeBuffer");
            exports.string2binary = function(str) {
                for (var result = "", i = 0; i < str.length; i++) result += String.fromCharCode(255 & str.charCodeAt(i));
                return result
            }, exports.arrayBuffer2Blob = function(buffer, mimeType) {
                exports.checkSupport("blob"), mimeType = mimeType || "application/zip";
                try {
                    return new Blob([buffer], {
                        type: mimeType
                    })
                } catch (e) {
                    try {
                        var Builder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder,
                            builder = new Builder;
                        return builder.append(buffer), builder.getBlob(mimeType)
                    } catch (e) {
                        throw new Error("Bug : can't construct the Blob.")
                    }
                }
            }, exports.applyFromCharCode = arrayLikeToString;
            var transform = {};
            transform.string = {
                string: identity,
                array: function(input) {
                    return stringToArrayLike(input, new Array(input.length))
                },
                arraybuffer: function(input) {
                    return transform.string.uint8array(input).buffer
                },
                uint8array: function(input) {
                    return stringToArrayLike(input, new Uint8Array(input.length))
                },
                nodebuffer: function(input) {
                    return stringToArrayLike(input, nodeBuffer(input.length))
                }
            }, transform.array = {
                string: arrayLikeToString,
                array: identity,
                arraybuffer: function(input) {
                    return new Uint8Array(input).buffer
                },
                uint8array: function(input) {
                    return new Uint8Array(input)
                },
                nodebuffer: function(input) {
                    return nodeBuffer(input)
                }
            }, transform.arraybuffer = {
                string: function(input) {
                    return arrayLikeToString(new Uint8Array(input))
                },
                array: function(input) {
                    return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength))
                },
                arraybuffer: identity,
                uint8array: function(input) {
                    return new Uint8Array(input)
                },
                nodebuffer: function(input) {
                    return nodeBuffer(new Uint8Array(input))
                }
            }, transform.uint8array = {
                string: arrayLikeToString,
                array: function(input) {
                    return arrayLikeToArrayLike(input, new Array(input.length))
                },
                arraybuffer: function(input) {
                    return input.buffer
                },
                uint8array: identity,
                nodebuffer: function(input) {
                    return nodeBuffer(input)
                }
            }, transform.nodebuffer = {
                string: arrayLikeToString,
                array: function(input) {
                    return arrayLikeToArrayLike(input, new Array(input.length))
                },
                arraybuffer: function(input) {
                    return transform.nodebuffer.uint8array(input).buffer
                },
                uint8array: function(input) {
                    return arrayLikeToArrayLike(input, new Uint8Array(input.length))
                },
                nodebuffer: identity
            }, exports.transformTo = function(outputType, input) {
                if (input || (input = ""), !outputType) return input;
                exports.checkSupport(outputType);
                var inputType = exports.getTypeOf(input),
                    result = transform[inputType][outputType](input);
                return result
            }, exports.getTypeOf = function(input) {
                return "string" == typeof input ? "string" : "[object Array]" === Object.prototype.toString.call(input) ? "array" : support.nodebuffer && nodeBuffer.test(input) ? "nodebuffer" : support.uint8array && input instanceof Uint8Array ? "uint8array" : support.arraybuffer && input instanceof ArrayBuffer ? "arraybuffer" : void 0
            }, exports.checkSupport = function(type) {
                var supported = support[type.toLowerCase()];
                if (!supported) throw new Error(type + " is not supported by this browser")
            }, exports.MAX_VALUE_16BITS = 65535, exports.MAX_VALUE_32BITS = -1, exports.pretty = function(str) {
                var code, i, res = "";
                for (i = 0; i < (str || "").length; i++) code = str.charCodeAt(i), res += "\\x" + (16 > code ? "0" : "") + code.toString(16).toUpperCase();
                return res
            }, exports.findCompression = function(compressionMethod) {
                for (var method in compressions)
                    if (compressions.hasOwnProperty(method) && compressions[method].magic === compressionMethod) return compressions[method];
                return null
            }, exports.isRegExp = function(object) {
                return "[object RegExp]" === Object.prototype.toString.call(object)
            }
        }, {
            "./compressions": 86,
            "./nodeBuffer": 94,
            "./support": 100
        }],
        105: [function(require, module, exports) {
            "use strict";

            function ZipEntries(data, loadOptions) {
                this.files = [], this.loadOptions = loadOptions, data && this.load(data)
            }
            var StringReader = require("./stringReader"),
                NodeBufferReader = require("./nodeBufferReader"),
                Uint8ArrayReader = require("./uint8ArrayReader"),
                utils = require("./utils"),
                sig = require("./signature"),
                ZipEntry = require("./zipEntry"),
                support = require("./support"),
                jszipProto = require("./object");
            ZipEntries.prototype = {
                checkSignature: function(expectedSignature) {
                    var signature = this.reader.readString(4);
                    if (signature !== expectedSignature) throw new Error("Corrupted zip or bug : unexpected signature (" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")")
                },
                readBlockEndOfCentral: function() {
                    this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2), this.zipComment = this.reader.readString(this.zipCommentLength), this.zipComment = jszipProto.utf8decode(this.zipComment)
                },
                readBlockZip64EndOfCentral: function() {
                    this.zip64EndOfCentralSize = this.reader.readInt(8), this.versionMadeBy = this.reader.readString(2), this.versionNeeded = this.reader.readInt(2), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
                    for (var extraFieldId, extraFieldLength, extraFieldValue, extraDataSize = this.zip64EndOfCentralSize - 44, index = 0; extraDataSize > index;) extraFieldId = this.reader.readInt(2), extraFieldLength = this.reader.readInt(4), extraFieldValue = this.reader.readString(extraFieldLength), this.zip64ExtensibleData[extraFieldId] = {
                        id: extraFieldId,
                        length: extraFieldLength,
                        value: extraFieldValue
                    }
                },
                readBlockZip64EndOfCentralLocator: function() {
                    if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), this.disksCount > 1) throw new Error("Multi-volumes zip are not supported")
                },
                readLocalFiles: function() {
                    var i, file;
                    for (i = 0; i < this.files.length; i++) file = this.files[i], this.reader.setIndex(file.localHeaderOffset), this.checkSignature(sig.LOCAL_FILE_HEADER), file.readLocalPart(this.reader), file.handleUTF8(), file.processAttributes()
                },
                readCentralDir: function() {
                    var file;
                    for (this.reader.setIndex(this.centralDirOffset); this.reader.readString(4) === sig.CENTRAL_FILE_HEADER;) file = new ZipEntry({
                        zip64: this.zip64
                    }, this.loadOptions), file.readCentralPart(this.reader), this.files.push(file)
                },
                readEndOfCentral: function() {
                    var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
                    if (-1 === offset) {
                        var isGarbage = !0;
                        try {
                            this.reader.setIndex(0), this.checkSignature(sig.LOCAL_FILE_HEADER), isGarbage = !1
                        } catch (e) {}
                        throw isGarbage ? new Error("Can't find end of central directory : is this a zip file ? If it is, see http://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip : can't find end of central directory")
                    }
                    if (this.reader.setIndex(offset), this.checkSignature(sig.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
                        if (this.zip64 = !0, offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR), -1 === offset) throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
                        this.reader.setIndex(offset), this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
                    }
                },
                prepareReader: function(data) {
                    var type = utils.getTypeOf(data);
                    "string" !== type || support.uint8array ? "nodebuffer" === type ? this.reader = new NodeBufferReader(data) : this.reader = new Uint8ArrayReader(utils.transformTo("uint8array", data)) : this.reader = new StringReader(data, this.loadOptions.optimizedBinaryString)
                },
                load: function(data) {
                    this.prepareReader(data), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles()
                }
            }, module.exports = ZipEntries
        }, {
            "./nodeBufferReader": 95,
            "./object": 96,
            "./signature": 97,
            "./stringReader": 98,
            "./support": 100,
            "./uint8ArrayReader": 101,
            "./utils": 104,
            "./zipEntry": 106
        }],
        106: [function(require, module, exports) {
            "use strict";

            function ZipEntry(options, loadOptions) {
                this.options = options, this.loadOptions = loadOptions
            }
            var StringReader = require("./stringReader"),
                utils = require("./utils"),
                CompressedObject = require("./compressedObject"),
                jszipProto = require("./object"),
                MADE_BY_DOS = 0,
                MADE_BY_UNIX = 3;
            ZipEntry.prototype = {
                isEncrypted: function() {
                    return 1 === (1 & this.bitFlag)
                },
                useUTF8: function() {
                    return 2048 === (2048 & this.bitFlag)
                },
                prepareCompressedContent: function(reader, from, length) {
                    return function() {
                        var previousIndex = reader.index;
                        reader.setIndex(from);
                        var compressedFileData = reader.readData(length);
                        return reader.setIndex(previousIndex), compressedFileData
                    }
                },
                prepareContent: function(reader, from, length, compression, uncompressedSize) {
                    return function() {
                        var compressedFileData = utils.transformTo(compression.uncompressInputType, this.getCompressedContent()),
                            uncompressedFileData = compression.uncompress(compressedFileData);
                        if (uncompressedFileData.length !== uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
                        return uncompressedFileData
                    }
                },
                readLocalPart: function(reader) {
                    var compression, localExtraFieldsLength;
                    if (reader.skip(22), this.fileNameLength = reader.readInt(2), localExtraFieldsLength = reader.readInt(2), this.fileName = reader.readString(this.fileNameLength), reader.skip(localExtraFieldsLength), -1 == this.compressedSize || -1 == this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory (compressedSize == -1 || uncompressedSize == -1)");
                    if (compression = utils.findCompression(this.compressionMethod), null === compression) throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + this.fileName + ")");
                    if (this.decompressed = new CompressedObject, this.decompressed.compressedSize = this.compressedSize, this.decompressed.uncompressedSize = this.uncompressedSize, this.decompressed.crc32 = this.crc32, this.decompressed.compressionMethod = this.compressionMethod, this.decompressed.getCompressedContent = this.prepareCompressedContent(reader, reader.index, this.compressedSize, compression), this.decompressed.getContent = this.prepareContent(reader, reader.index, this.compressedSize, compression, this.uncompressedSize), this.loadOptions.checkCRC32 && (this.decompressed = utils.transformTo("string", this.decompressed.getContent()), jszipProto.crc32(this.decompressed) !== this.crc32)) throw new Error("Corrupted zip : CRC32 mismatch")
                },
                readCentralPart: function(reader) {
                    if (this.versionMadeBy = reader.readInt(2), this.versionNeeded = reader.readInt(2), this.bitFlag = reader.readInt(2), this.compressionMethod = reader.readString(2), this.date = reader.readDate(), this.crc32 = reader.readInt(4), this.compressedSize = reader.readInt(4), this.uncompressedSize = reader.readInt(4), this.fileNameLength = reader.readInt(2), this.extraFieldsLength = reader.readInt(2), this.fileCommentLength = reader.readInt(2), this.diskNumberStart = reader.readInt(2), this.internalFileAttributes = reader.readInt(2), this.externalFileAttributes = reader.readInt(4), this.localHeaderOffset = reader.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
                    this.fileName = reader.readString(this.fileNameLength), this.readExtraFields(reader), this.parseZIP64ExtraField(reader), this.fileComment = reader.readString(this.fileCommentLength)
                },
                processAttributes: function() {
                    this.unixPermissions = null, this.dosPermissions = null;
                    var madeBy = this.versionMadeBy >> 8;
                    this.dir = 16 & this.externalFileAttributes ? !0 : !1, madeBy === MADE_BY_DOS && (this.dosPermissions = 63 & this.externalFileAttributes), madeBy === MADE_BY_UNIX && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileName.slice(-1) || (this.dir = !0)
                },
                parseZIP64ExtraField: function(reader) {
                    if (this.extraFields[1]) {
                        var extraReader = new StringReader(this.extraFields[1].value);
                        this.uncompressedSize === utils.MAX_VALUE_32BITS && (this.uncompressedSize = extraReader.readInt(8)), this.compressedSize === utils.MAX_VALUE_32BITS && (this.compressedSize = extraReader.readInt(8)), this.localHeaderOffset === utils.MAX_VALUE_32BITS && (this.localHeaderOffset = extraReader.readInt(8)), this.diskNumberStart === utils.MAX_VALUE_32BITS && (this.diskNumberStart = extraReader.readInt(4))
                    }
                },
                readExtraFields: function(reader) {
                    var extraFieldId, extraFieldLength, extraFieldValue, start = reader.index;
                    for (this.extraFields = this.extraFields || {}; reader.index < start + this.extraFieldsLength;) extraFieldId = reader.readInt(2), extraFieldLength = reader.readInt(2), extraFieldValue = reader.readString(extraFieldLength), this.extraFields[extraFieldId] = {
                        id: extraFieldId,
                        length: extraFieldLength,
                        value: extraFieldValue
                    }
                },
                handleUTF8: function() {
                    if (this.useUTF8()) this.fileName = jszipProto.utf8decode(this.fileName), this.fileComment = jszipProto.utf8decode(this.fileComment);
                    else {
                        var upath = this.findExtraFieldUnicodePath();
                        null !== upath && (this.fileName = upath);
                        var ucomment = this.findExtraFieldUnicodeComment();
                        null !== ucomment && (this.fileComment = ucomment)
                    }
                },
                findExtraFieldUnicodePath: function() {
                    var upathField = this.extraFields[28789];
                    if (upathField) {
                        var extraReader = new StringReader(upathField.value);
                        return 1 !== extraReader.readInt(1) ? null : jszipProto.crc32(this.fileName) !== extraReader.readInt(4) ? null : jszipProto.utf8decode(extraReader.readString(upathField.length - 5))
                    }
                    return null
                },
                findExtraFieldUnicodeComment: function() {
                    var ucommentField = this.extraFields[25461];
                    if (ucommentField) {
                        var extraReader = new StringReader(ucommentField.value);
                        return 1 !== extraReader.readInt(1) ? null : jszipProto.crc32(this.fileComment) !== extraReader.readInt(4) ? null : jszipProto.utf8decode(extraReader.readString(ucommentField.length - 5))
                    }
                    return null
                }
            }, module.exports = ZipEntry
        }, {
            "./compressedObject": 85,
            "./object": 96,
            "./stringReader": 98,
            "./utils": 104
        }],
        107: [function(require, module, exports) {
            exports.Parser = require("./lib/parser").Parser, exports.rules = require("./lib/rules"), exports.errors = require("./lib/errors"), exports.results = require("./lib/parsing-results"), exports.StringSource = require("./lib/StringSource"), exports.Token = require("./lib/Token"), exports.bottomUp = require("./lib/bottom-up"), exports.RegexTokeniser = require("./lib/regex-tokeniser").RegexTokeniser, exports.rule = function(ruleBuilder) {
                var rule;
                return function(input) {
                    return rule || (rule = ruleBuilder()), rule(input)
                }
            }
        }, {
            "./lib/StringSource": 108,
            "./lib/Token": 109,
            "./lib/bottom-up": 111,
            "./lib/errors": 112,
            "./lib/parser": 114,
            "./lib/parsing-results": 115,
            "./lib/regex-tokeniser": 116,
            "./lib/rules": 117
        }],
        108: [function(require, module, exports) {
            var util = require("util"),
                StringSourceRange = (module.exports = function(string, description) {
                    var self = {
                        asString: function() {
                            return string
                        },
                        range: function(startIndex, endIndex) {
                            return new StringSourceRange(string, description, startIndex, endIndex)
                        }
                    };
                    return self
                }, function(string, description, startIndex, endIndex) {
                    this._string = string, this._description = description, this._startIndex = startIndex, this._endIndex = endIndex
                });
            StringSourceRange.prototype.to = function(otherRange) {
                return new StringSourceRange(this._string, this._description, this._startIndex, otherRange._endIndex)
            }, StringSourceRange.prototype.describe = function() {
                var position = this._position(),
                    description = this._description ? this._description + "\n" : "";
                return util.format("%sLine number: %s\nCharacter number: %s", description, position.lineNumber, position.characterNumber)
            }, StringSourceRange.prototype.lineNumber = function() {
                return this._position().lineNumber
            }, StringSourceRange.prototype.characterNumber = function() {
                return this._position().characterNumber
            }, StringSourceRange.prototype._position = function() {
                for (var self = this, index = 0, nextNewLine = function() {
                        return self._string.indexOf("\n", index)
                    }, lineNumber = 1; - 1 !== nextNewLine() && nextNewLine() < this._startIndex;) index = nextNewLine() + 1, lineNumber += 1;
                var characterNumber = this._startIndex - index + 1;
                return {
                    lineNumber: lineNumber,
                    characterNumber: characterNumber
                }
            }
        }, {
            util: 157
        }],
        109: [function(require, module, exports) {
            module.exports = function(name, value, source) {
                this.name = name, this.value = value, source && (this.source = source)
            }
        }, {}],
        110: [function(require, module, exports) {
            var TokenIterator = module.exports = function(tokens, startIndex) {
                this._tokens = tokens, this._startIndex = startIndex || 0
            };
            TokenIterator.prototype.head = function() {
                return this._tokens[this._startIndex]
            }, TokenIterator.prototype.tail = function(startIndex) {
                return new TokenIterator(this._tokens, this._startIndex + 1)
            }, TokenIterator.prototype.toArray = function() {
                return this._tokens.slice(this._startIndex)
            }, TokenIterator.prototype.end = function() {
                return this._tokens[this._tokens.length - 1]
            }, TokenIterator.prototype.to = function(end) {
                var start = this.head().source,
                    endToken = end.head() || end.end();
                return start.to(endToken.source)
            }
        }, {}],
        111: [function(require, module, exports) {
            function InfixRules(infixRules) {
                function untilExclusive(name) {
                    return new InfixRules(infixRules.slice(0, ruleNames().indexOf(name)))
                }

                function untilInclusive(name) {
                    return new InfixRules(infixRules.slice(0, ruleNames().indexOf(name) + 1))
                }

                function ruleNames() {
                    return infixRules.map(function(rule) {
                        return rule.name
                    })
                }

                function apply(leftResult) {
                    for (var currentResult, source;;) {
                        if (currentResult = applyToTokens(leftResult.remaining()), !currentResult.isSuccess()) return currentResult.isFailure() ? leftResult : currentResult;
                        source = leftResult.source().to(currentResult.source()), leftResult = results.success(currentResult.value()(leftResult.value(), source), currentResult.remaining(), source)
                    }
                }

                function applyToTokens(tokens) {
                    return rules.firstOf("infix", infixRules.map(function(infix) {
                        return infix.rule
                    }))(tokens)
                }
                return {
                    apply: apply,
                    untilExclusive: untilExclusive,
                    untilInclusive: untilInclusive
                }
            }
            var rules = require("./rules"),
                results = require("./parsing-results");
            exports.parser = function(name, prefixRules, infixRuleBuilders) {
                function createInfixRule(infixRuleBuilder) {
                    return {
                        name: infixRuleBuilder.name,
                        rule: lazyRule(infixRuleBuilder.ruleBuilder.bind(null, self))
                    }
                }

                function rule() {
                    return createRule(infixRules)
                }

                function leftAssociative(name) {
                    return createRule(infixRules.untilExclusive(name))
                }

                function rightAssociative(name) {
                    return createRule(infixRules.untilInclusive(name))
                }

                function createRule(infixRules) {
                    return apply.bind(null, infixRules)
                }

                function apply(infixRules, tokens) {
                    var leftResult = prefixRule(tokens);
                    return leftResult.isSuccess() ? infixRules.apply(leftResult) : leftResult
                }
                var self = {
                        rule: rule,
                        leftAssociative: leftAssociative,
                        rightAssociative: rightAssociative
                    },
                    infixRules = new InfixRules(infixRuleBuilders.map(createInfixRule)),
                    prefixRule = rules.firstOf(name, prefixRules);
                return self
            }, exports.infix = function(name, ruleBuilder) {
                function map(func) {
                    return exports.infix(name, function(parser) {
                        var rule = ruleBuilder(parser);
                        return function(tokens) {
                            var result = rule(tokens);
                            return result.map(function(right) {
                                return function(left, source) {
                                    return func(left, right, source)
                                }
                            })
                        }
                    })
                }
                return {
                    name: name,
                    ruleBuilder: ruleBuilder,
                    map: map
                }
            };
            var lazyRule = function(ruleBuilder) {
                var rule;
                return function(input) {
                    return rule || (rule = ruleBuilder()), rule(input)
                }
            }
        }, {
            "./parsing-results": 115,
            "./rules": 117
        }],
        112: [function(require, module, exports) {
            exports.error = function(options) {
                return new Error(options)
            };
            var Error = function(options) {
                this.expected = options.expected, this.actual = options.actual, this._location = options.location
            };
            Error.prototype.describe = function() {
                var locationDescription = this._location ? this._location.describe() + ":\n" : "";
                return locationDescription + "Expected " + this.expected + "\nbut got " + this.actual
            }, Error.prototype.lineNumber = function() {
                return this._location.lineNumber()
            }, Error.prototype.characterNumber = function() {
                return this._location.characterNumber()
            }
        }, {}],
        113: [function(require, module, exports) {
            var LazyIterator = (exports.fromArray = function(array) {
                var index = 0,
                    hasNext = function() {
                        return index < array.length
                    };
                return new LazyIterator({
                    hasNext: hasNext,
                    next: function() {
                        if (hasNext()) return array[index++];
                        throw new Error("No more elements")
                    }
                })
            }, function(iterator) {
                this._iterator = iterator
            });
            LazyIterator.prototype.map = function(func) {
                var iterator = this._iterator;
                return new LazyIterator({
                    hasNext: function() {
                        return iterator.hasNext()
                    },
                    next: function() {
                        return func(iterator.next())
                    }
                })
            }, LazyIterator.prototype.filter = function(condition) {
                var next, iterator = this._iterator,
                    moved = !1,
                    hasNext = !1,
                    moveIfNecessary = function() {
                        if (!moved)
                            for (moved = !0, hasNext = !1; iterator.hasNext() && !hasNext;) next = iterator.next(), hasNext = condition(next)
                    };
                return new LazyIterator({
                    hasNext: function() {
                        return moveIfNecessary(), hasNext
                    },
                    next: function() {
                        moveIfNecessary();
                        var toReturn = next;
                        return moved = !1, toReturn
                    }
                })
            }, LazyIterator.prototype.first = function() {
                var iterator = this._iterator;
                return this._iterator.hasNext() ? iterator.next() : null
            }, LazyIterator.prototype.toArray = function() {
                for (var result = []; this._iterator.hasNext();) result.push(this._iterator.next());
                return result
            }
        }, {}],
        114: [function(require, module, exports) {
            var TokenIterator = require("./TokenIterator");
            exports.Parser = function(options) {
                var parseTokens = function(parser, tokens) {
                    return parser(new TokenIterator(tokens))
                };
                return {
                    parseTokens: parseTokens
                }
            }
        }, {
            "./TokenIterator": 110
        }],
        115: [function(require, module, exports) {
            module.exports = {
                failure: function(errors, remaining) {
                    if (errors.length < 1) throw new Error("Failure must have errors");
                    return new Result({
                        status: "failure",
                        remaining: remaining,
                        errors: errors
                    })
                },
                error: function(errors, remaining) {
                    if (errors.length < 1) throw new Error("Failure must have errors");
                    return new Result({
                        status: "error",
                        remaining: remaining,
                        errors: errors
                    })
                },
                success: function(value, remaining, source) {
                    return new Result({
                        status: "success",
                        value: value,
                        source: source,
                        remaining: remaining,
                        errors: []
                    })
                },
                cut: function(remaining) {
                    return new Result({
                        status: "cut",
                        remaining: remaining,
                        errors: []
                    })
                }
            };
            var Result = function(options) {
                this._value = options.value, this._status = options.status, this._hasValue = void 0 !== options.value, this._remaining = options.remaining, this._source = options.source, this._errors = options.errors
            };
            Result.prototype.map = function(func) {
                return this._hasValue ? new Result({
                    value: func(this._value, this._source),
                    status: this._status,
                    remaining: this._remaining,
                    source: this._source,
                    errors: this._errors
                }) : this
            }, Result.prototype.changeRemaining = function(remaining) {
                return new Result({
                    value: this._value,
                    status: this._status,
                    remaining: remaining,
                    source: this._source,
                    errors: this._errors
                })
            }, Result.prototype.isSuccess = function() {
                return "success" === this._status || "cut" === this._status
            }, Result.prototype.isFailure = function() {
                return "failure" === this._status
            }, Result.prototype.isError = function() {
                return "error" === this._status
            }, Result.prototype.isCut = function() {
                return "cut" === this._status
            }, Result.prototype.value = function() {
                return this._value
            }, Result.prototype.remaining = function() {
                return this._remaining
            }, Result.prototype.source = function() {
                return this._source
            }, Result.prototype.errors = function() {
                return this._errors
            }
        }, {}],
        116: [function(require, module, exports) {
            function RegexTokeniser(rules) {
                function tokenise(input, description) {
                    for (var source = new StringSource(input, description), index = 0, tokens = []; index < input.length;) {
                        var result = readNextToken(input, index, source);
                        index = result.endIndex, tokens.push(result.token)
                    }
                    return tokens.push(endToken(input, source)), tokens
                }

                function readNextToken(string, startIndex, source) {
                    for (var i = 0; i < rules.length; i++) {
                        var regex = rules[i].regex;
                        regex.lastIndex = startIndex;
                        var result = regex.exec(string);
                        if (result) {
                            var endIndex = startIndex + result[0].length;
                            if (result.index === startIndex && endIndex > startIndex) {
                                var value = result[1],
                                    token = new Token(rules[i].name, value, source.range(startIndex, endIndex));
                                return {
                                    token: token,
                                    endIndex: endIndex
                                }
                            }
                        }
                    }
                    var endIndex = startIndex + 1,
                        token = new Token("unrecognisedCharacter", string.substring(startIndex, endIndex), source.range(startIndex, endIndex));
                    return {
                        token: token,
                        endIndex: endIndex
                    }
                }

                function endToken(input, source) {
                    return new Token("end", null, source.range(input.length, input.length))
                }
                return rules = rules.map(function(rule) {
                    return {
                        name: rule.name,
                        regex: new RegExp(rule.regex.source, "g")
                    }
                }), {
                    tokenise: tokenise
                }
            }
            var Token = require("./Token"),
                StringSource = require("./StringSource");
            exports.RegexTokeniser = RegexTokeniser
        }, {
            "./StringSource": 108,
            "./Token": 109
        }],
        117: [function(require, module, exports) {
            function noOpRule(input) {
                return results.success(null, input)
            }

            function describeTokenMismatch(input, expected) {
                var error, token = input.head();
                return error = token ? errors.error({
                    expected: expected,
                    actual: describeToken(token),
                    location: token.source
                }) : errors.error({
                    expected: expected,
                    actual: "end of tokens"
                }), results.failure([error], input)
            }
            var _ = require("underscore"),
                options = require("option"),
                results = require("./parsing-results"),
                errors = require("./errors"),
                lazyIterators = require("./lazy-iterators");
            exports.token = function(tokenType, value) {
                var matchValue = void 0 !== value;
                return function(input) {
                    var token = input.head();
                    if (!token || token.name !== tokenType || matchValue && token.value !== value) {
                        var expected = describeToken({
                            name: tokenType,
                            value: value
                        });
                        return describeTokenMismatch(input, expected)
                    }
                    return results.success(token.value, input.tail(), token.source)
                }
            }, exports.tokenOfType = function(tokenType) {
                return exports.token(tokenType)
            }, exports.firstOf = function(name, parsers) {
                return _.isArray(parsers) || (parsers = Array.prototype.slice.call(arguments, 1)),
                    function(input) {
                        return lazyIterators.fromArray(parsers).map(function(parser) {
                            return parser(input)
                        }).filter(function(result) {
                            return result.isSuccess() || result.isError()
                        }).first() || describeTokenMismatch(input, name)
                    }
            }, exports.then = function(parser, func) {
                return function(input) {
                    var result = parser(input);
                    return result.map || console.log(result), result.map(func)
                }
            }, exports.sequence = function() {
                function isCapturedRule(subRule) {
                    return subRule.isCaptured
                }
                var parsers = Array.prototype.slice.call(arguments, 0),
                    rule = function(input) {
                        var result = _.foldl(parsers, function(memo, parser) {
                                var result = memo.result,
                                    hasCut = memo.hasCut;
                                if (!result.isSuccess()) return {
                                    result: result,
                                    hasCut: hasCut
                                };
                                var subResult = parser(result.remaining());
                                if (subResult.isCut()) return {
                                    result: result,
                                    hasCut: !0
                                };
                                if (subResult.isSuccess()) {
                                    var values;
                                    values = parser.isCaptured ? result.value().withValue(parser, subResult.value()) : result.value();
                                    var remaining = subResult.remaining(),
                                        source = input.to(remaining);
                                    return {
                                        result: results.success(values, remaining, source),
                                        hasCut: hasCut
                                    }
                                }
                                return hasCut ? {
                                    result: results.error(subResult.errors(), subResult.remaining()),
                                    hasCut: hasCut
                                } : {
                                    result: subResult,
                                    hasCut: hasCut
                                }
                            }, {
                                result: results.success(new SequenceValues, input),
                                hasCut: !1
                            }).result,
                            source = input.to(result.remaining());
                        return result.map(function(values) {
                            return values.withValue(exports.sequence.source, source)
                        })
                    };
                return rule.head = function() {
                    var firstCapture = _.find(parsers, isCapturedRule);
                    return exports.then(rule, exports.sequence.extract(firstCapture))
                }, rule.map = function(func) {
                    return exports.then(rule, function(result) {
                        return func.apply(this, result.toArray())
                    })
                }, rule
            };
            var SequenceValues = function(values, valuesArray) {
                this._values = values || {}, this._valuesArray = valuesArray || []
            };
            SequenceValues.prototype.withValue = function(rule, value) {
                if (rule.captureName && rule.captureName in this._values) throw new Error('Cannot add second value for capture "' + rule.captureName + '"');
                var newValues = _.clone(this._values);
                newValues[rule.captureName] = value;
                var newValuesArray = this._valuesArray.concat([value]);
                return new SequenceValues(newValues, newValuesArray)
            }, SequenceValues.prototype.get = function(rule) {
                if (rule.captureName in this._values) return this._values[rule.captureName];
                throw new Error('No value for capture "' + rule.captureName + '"')
            }, SequenceValues.prototype.toArray = function() {
                return this._valuesArray
            }, exports.sequence.capture = function(rule, name) {
                var captureRule = function() {
                    return rule.apply(this, arguments)
                };
                return captureRule.captureName = name, captureRule.isCaptured = !0, captureRule
            }, exports.sequence.extract = function(rule) {
                return function(result) {
                    return result.get(rule)
                }
            }, exports.sequence.applyValues = function(func) {
                var rules = Array.prototype.slice.call(arguments, 1);
                return function(result) {
                    var values = rules.map(function(rule) {
                        return result.get(rule)
                    });
                    return func.apply(this, values)
                }
            }, exports.sequence.source = {
                captureName: "☃source☃"
            }, exports.sequence.cut = function() {
                return function(input) {
                    return results.cut(input)
                }
            }, exports.optional = function(rule) {
                return function(input) {
                    var result = rule(input);
                    return result.isSuccess() ? result.map(options.some) : result.isFailure() ? results.success(options.none, input) : result
                }
            }, exports.zeroOrMoreWithSeparator = function(rule, separator) {
                return repeatedWithSeparator(rule, separator, !1)
            }, exports.oneOrMoreWithSeparator = function(rule, separator) {
                return repeatedWithSeparator(rule, separator, !0)
            };
            var zeroOrMore = exports.zeroOrMore = function(rule) {
                return function(input) {
                    for (var result, values = [];
                        (result = rule(input)) && result.isSuccess();) input = result.remaining(), values.push(result.value());
                    return result.isError() ? result : results.success(values, input)
                }
            };
            exports.oneOrMore = function(rule) {
                return exports.oneOrMoreWithSeparator(rule, noOpRule)
            };
            var repeatedWithSeparator = function(rule, separator, isOneOrMore) {
                return function(input) {
                    var result = rule(input);
                    if (result.isSuccess()) {
                        var mainRule = exports.sequence.capture(rule, "main"),
                            remainingRule = zeroOrMore(exports.then(exports.sequence(separator, mainRule), exports.sequence.extract(mainRule))),
                            remainingResult = remainingRule(result.remaining());
                        return results.success([result.value()].concat(remainingResult.value()), remainingResult.remaining())
                    }
                    return isOneOrMore || result.isError() ? result : results.success([], input)
                }
            };
            exports.leftAssociative = function(leftRule, rightRule, func) {
                var rights;
                rights = func ? [{
                    func: func,
                    rule: rightRule
                }] : rightRule, rights = rights.map(function(right) {
                    return exports.then(right.rule, function(rightValue) {
                        return function(leftValue, source) {
                            return right.func(leftValue, rightValue, source)
                        }
                    })
                });
                var repeatedRule = exports.firstOf.apply(null, ["rules"].concat(rights));
                return function(input) {
                    var start = input,
                        leftResult = leftRule(input);
                    if (!leftResult.isSuccess()) return leftResult;
                    for (var repeatedResult = repeatedRule(leftResult.remaining()); repeatedResult.isSuccess();) {
                        var remaining = repeatedResult.remaining(),
                            source = start.to(repeatedResult.remaining()),
                            right = repeatedResult.value();
                        leftResult = results.success(right(leftResult.value(), source), remaining, source), repeatedResult = repeatedRule(leftResult.remaining())
                    }
                    return repeatedResult.isError() ? repeatedResult : leftResult
                }
            }, exports.leftAssociative.firstOf = function() {
                return Array.prototype.slice.call(arguments, 0)
            }, exports.nonConsuming = function(rule) {
                return function(input) {
                    return rule(input).changeRemaining(input)
                }
            };
            var describeToken = function(token) {
                return token.value ? token.name + ' "' + token.value + '"' : token.name
            }
        }, {
            "./errors": 112,
            "./lazy-iterators": 113,
            "./parsing-results": 115,
            option: 119,
            underscore: 118
        }],
        118: [function(require, module, exports) {
            (function() {
                var root = this,
                    previousUnderscore = root._,
                    breaker = {},
                    ArrayProto = Array.prototype,
                    ObjProto = Object.prototype,
                    FuncProto = Function.prototype,
                    push = ArrayProto.push,
                    slice = ArrayProto.slice,
                    concat = ArrayProto.concat,
                    toString = ObjProto.toString,
                    hasOwnProperty = ObjProto.hasOwnProperty,
                    nativeForEach = ArrayProto.forEach,
                    nativeMap = ArrayProto.map,
                    nativeReduce = ArrayProto.reduce,
                    nativeReduceRight = ArrayProto.reduceRight,
                    nativeFilter = ArrayProto.filter,
                    nativeEvery = ArrayProto.every,
                    nativeSome = ArrayProto.some,
                    nativeIndexOf = ArrayProto.indexOf,
                    nativeLastIndexOf = ArrayProto.lastIndexOf,
                    nativeIsArray = Array.isArray,
                    nativeKeys = Object.keys,
                    nativeBind = FuncProto.bind,
                    _ = function(obj) {
                        return obj instanceof _ ? obj : this instanceof _ ? void(this._wrapped = obj) : new _(obj)
                    };
                "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = _), exports._ = _) : root._ = _, _.VERSION = "1.4.4";
                var each = _.each = _.forEach = function(obj, iterator, context) {
                    if (null != obj)
                        if (nativeForEach && obj.forEach === nativeForEach) obj.forEach(iterator, context);
                        else if (obj.length === +obj.length) {
                        for (var i = 0, l = obj.length; l > i; i++)
                            if (iterator.call(context, obj[i], i, obj) === breaker) return
                    } else
                        for (var key in obj)
                            if (_.has(obj, key) && iterator.call(context, obj[key], key, obj) === breaker) return
                };
                _.map = _.collect = function(obj, iterator, context) {
                    var results = [];
                    return null == obj ? results : nativeMap && obj.map === nativeMap ? obj.map(iterator, context) : (each(obj, function(value, index, list) {
                        results[results.length] = iterator.call(context, value, index, list)
                    }), results)
                };
                var reduceError = "Reduce of empty array with no initial value";
                _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
                    var initial = arguments.length > 2;
                    if (null == obj && (obj = []), nativeReduce && obj.reduce === nativeReduce) return context && (iterator = _.bind(iterator, context)), initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
                    if (each(obj, function(value, index, list) {
                            initial ? memo = iterator.call(context, memo, value, index, list) : (memo = value, initial = !0)
                        }), !initial) throw new TypeError(reduceError);
                    return memo
                }, _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
                    var initial = arguments.length > 2;
                    if (null == obj && (obj = []), nativeReduceRight && obj.reduceRight === nativeReduceRight) return context && (iterator = _.bind(iterator, context)), initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
                    var length = obj.length;
                    if (length !== +length) {
                        var keys = _.keys(obj);
                        length = keys.length
                    }
                    if (each(obj, function(value, index, list) {
                            index = keys ? keys[--length] : --length, initial ? memo = iterator.call(context, memo, obj[index], index, list) : (memo = obj[index], initial = !0)
                        }), !initial) throw new TypeError(reduceError);
                    return memo
                }, _.find = _.detect = function(obj, iterator, context) {
                    var result;
                    return any(obj, function(value, index, list) {
                        return iterator.call(context, value, index, list) ? (result = value, !0) : void 0
                    }), result
                }, _.filter = _.select = function(obj, iterator, context) {
                    var results = [];
                    return null == obj ? results : nativeFilter && obj.filter === nativeFilter ? obj.filter(iterator, context) : (each(obj, function(value, index, list) {
                        iterator.call(context, value, index, list) && (results[results.length] = value)
                    }), results)
                }, _.reject = function(obj, iterator, context) {
                    return _.filter(obj, function(value, index, list) {
                        return !iterator.call(context, value, index, list)
                    }, context)
                }, _.every = _.all = function(obj, iterator, context) {
                    iterator || (iterator = _.identity);
                    var result = !0;
                    return null == obj ? result : nativeEvery && obj.every === nativeEvery ? obj.every(iterator, context) : (each(obj, function(value, index, list) {
                        return (result = result && iterator.call(context, value, index, list)) ? void 0 : breaker
                    }), !!result)
                };
                var any = _.some = _.any = function(obj, iterator, context) {
                    iterator || (iterator = _.identity);
                    var result = !1;
                    return null == obj ? result : nativeSome && obj.some === nativeSome ? obj.some(iterator, context) : (each(obj, function(value, index, list) {
                        return result || (result = iterator.call(context, value, index, list)) ? breaker : void 0
                    }), !!result)
                };
                _.contains = _.include = function(obj, target) {
                    return null == obj ? !1 : nativeIndexOf && obj.indexOf === nativeIndexOf ? -1 != obj.indexOf(target) : any(obj, function(value) {
                        return value === target
                    })
                }, _.invoke = function(obj, method) {
                    var args = slice.call(arguments, 2),
                        isFunc = _.isFunction(method);
                    return _.map(obj, function(value) {
                        return (isFunc ? method : value[method]).apply(value, args)
                    })
                }, _.pluck = function(obj, key) {
                    return _.map(obj, function(value) {
                        return value[key]
                    })
                }, _.where = function(obj, attrs, first) {
                    return _.isEmpty(attrs) ? first ? null : [] : _[first ? "find" : "filter"](obj, function(value) {
                        for (var key in attrs)
                            if (attrs[key] !== value[key]) return !1;
                        return !0
                    })
                }, _.findWhere = function(obj, attrs) {
                    return _.where(obj, attrs, !0)
                }, _.max = function(obj, iterator, context) {
                    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) return Math.max.apply(Math, obj);
                    if (!iterator && _.isEmpty(obj)) return -(1 / 0);
                    var result = {
                        computed: -(1 / 0),
                        value: -(1 / 0)
                    };
                    return each(obj, function(value, index, list) {
                        var computed = iterator ? iterator.call(context, value, index, list) : value;
                        computed >= result.computed && (result = {
                            value: value,
                            computed: computed
                        })
                    }), result.value
                }, _.min = function(obj, iterator, context) {
                    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) return Math.min.apply(Math, obj);
                    if (!iterator && _.isEmpty(obj)) return 1 / 0;
                    var result = {
                        computed: 1 / 0,
                        value: 1 / 0
                    };
                    return each(obj, function(value, index, list) {
                        var computed = iterator ? iterator.call(context, value, index, list) : value;
                        computed < result.computed && (result = {
                            value: value,
                            computed: computed
                        })
                    }), result.value
                }, _.shuffle = function(obj) {
                    var rand, index = 0,
                        shuffled = [];
                    return each(obj, function(value) {
                        rand = _.random(index++), shuffled[index - 1] = shuffled[rand], shuffled[rand] = value
                    }), shuffled
                };
                var lookupIterator = function(value) {
                    return _.isFunction(value) ? value : function(obj) {
                        return obj[value]
                    }
                };
                _.sortBy = function(obj, value, context) {
                    var iterator = lookupIterator(value);
                    return _.pluck(_.map(obj, function(value, index, list) {
                        return {
                            value: value,
                            index: index,
                            criteria: iterator.call(context, value, index, list)
                        }
                    }).sort(function(left, right) {
                        var a = left.criteria,
                            b = right.criteria;
                        if (a !== b) {
                            if (a > b || void 0 === a) return 1;
                            if (b > a || void 0 === b) return -1
                        }
                        return left.index < right.index ? -1 : 1
                    }), "value")
                };
                var group = function(obj, value, context, behavior) {
                    var result = {},
                        iterator = lookupIterator(value || _.identity);
                    return each(obj, function(value, index) {
                        var key = iterator.call(context, value, index, obj);
                        behavior(result, key, value)
                    }), result
                };
                _.groupBy = function(obj, value, context) {
                    return group(obj, value, context, function(result, key, value) {
                        (_.has(result, key) ? result[key] : result[key] = []).push(value)
                    })
                }, _.countBy = function(obj, value, context) {
                    return group(obj, value, context, function(result, key) {
                        _.has(result, key) || (result[key] = 0), result[key]++
                    })
                }, _.sortedIndex = function(array, obj, iterator, context) {
                    iterator = null == iterator ? _.identity : lookupIterator(iterator);
                    for (var value = iterator.call(context, obj), low = 0, high = array.length; high > low;) {
                        var mid = low + high >>> 1;
                        iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid
                    }
                    return low
                }, _.toArray = function(obj) {
                    return obj ? _.isArray(obj) ? slice.call(obj) : obj.length === +obj.length ? _.map(obj, _.identity) : _.values(obj) : []
                }, _.size = function(obj) {
                    return null == obj ? 0 : obj.length === +obj.length ? obj.length : _.keys(obj).length
                }, _.first = _.head = _.take = function(array, n, guard) {
                    return null == array ? void 0 : null == n || guard ? array[0] : slice.call(array, 0, n)
                }, _.initial = function(array, n, guard) {
                    return slice.call(array, 0, array.length - (null == n || guard ? 1 : n))
                }, _.last = function(array, n, guard) {
                    return null == array ? void 0 : null == n || guard ? array[array.length - 1] : slice.call(array, Math.max(array.length - n, 0))
                }, _.rest = _.tail = _.drop = function(array, n, guard) {
                    return slice.call(array, null == n || guard ? 1 : n)
                }, _.compact = function(array) {
                    return _.filter(array, _.identity)
                };
                var flatten = function(input, shallow, output) {
                    return each(input, function(value) {
                        _.isArray(value) ? shallow ? push.apply(output, value) : flatten(value, shallow, output) : output.push(value)
                    }), output
                };
                _.flatten = function(array, shallow) {
                    return flatten(array, shallow, [])
                }, _.without = function(array) {
                    return _.difference(array, slice.call(arguments, 1))
                }, _.uniq = _.unique = function(array, isSorted, iterator, context) {
                    _.isFunction(isSorted) && (context = iterator, iterator = isSorted, isSorted = !1);
                    var initial = iterator ? _.map(array, iterator, context) : array,
                        results = [],
                        seen = [];
                    return each(initial, function(value, index) {
                        (isSorted ? index && seen[seen.length - 1] === value : _.contains(seen, value)) || (seen.push(value), results.push(array[index]))
                    }), results
                }, _.union = function() {
                    return _.uniq(concat.apply(ArrayProto, arguments))
                }, _.intersection = function(array) {
                    var rest = slice.call(arguments, 1);
                    return _.filter(_.uniq(array), function(item) {
                        return _.every(rest, function(other) {
                            return _.indexOf(other, item) >= 0
                        })
                    })
                }, _.difference = function(array) {
                    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
                    return _.filter(array, function(value) {
                        return !_.contains(rest, value)
                    })
                }, _.zip = function() {
                    for (var args = slice.call(arguments), length = _.max(_.pluck(args, "length")), results = new Array(length), i = 0; length > i; i++) results[i] = _.pluck(args, "" + i);
                    return results
                }, _.object = function(list, values) {
                    if (null == list) return {};
                    for (var result = {}, i = 0, l = list.length; l > i; i++) values ? result[list[i]] = values[i] : result[list[i][0]] = list[i][1];
                    return result
                }, _.indexOf = function(array, item, isSorted) {
                    if (null == array) return -1;
                    var i = 0,
                        l = array.length;
                    if (isSorted) {
                        if ("number" != typeof isSorted) return i = _.sortedIndex(array, item), array[i] === item ? i : -1;
                        i = 0 > isSorted ? Math.max(0, l + isSorted) : isSorted
                    }
                    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
                    for (; l > i; i++)
                        if (array[i] === item) return i;
                    return -1
                }, _.lastIndexOf = function(array, item, from) {
                    if (null == array) return -1;
                    var hasIndex = null != from;
                    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
                    for (var i = hasIndex ? from : array.length; i--;)
                        if (array[i] === item) return i;
                    return -1
                }, _.range = function(start, stop, step) {
                    arguments.length <= 1 && (stop = start || 0, start = 0), step = arguments[2] || 1;
                    for (var len = Math.max(Math.ceil((stop - start) / step), 0), idx = 0, range = new Array(len); len > idx;) range[idx++] = start, start += step;
                    return range
                }, _.bind = function(func, context) {
                    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                    var args = slice.call(arguments, 2);
                    return function() {
                        return func.apply(context, args.concat(slice.call(arguments)))
                    }
                }, _.partial = function(func) {
                    var args = slice.call(arguments, 1);
                    return function() {
                        return func.apply(this, args.concat(slice.call(arguments)))
                    }
                }, _.bindAll = function(obj) {
                    var funcs = slice.call(arguments, 1);
                    return 0 === funcs.length && (funcs = _.functions(obj)), each(funcs, function(f) {
                        obj[f] = _.bind(obj[f], obj)
                    }), obj
                }, _.memoize = function(func, hasher) {
                    var memo = {};
                    return hasher || (hasher = _.identity),
                        function() {
                            var key = hasher.apply(this, arguments);
                            return _.has(memo, key) ? memo[key] : memo[key] = func.apply(this, arguments)
                        }
                }, _.delay = function(func, wait) {
                    var args = slice.call(arguments, 2);
                    return setTimeout(function() {
                        return func.apply(null, args)
                    }, wait)
                }, _.defer = function(func) {
                    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)))
                }, _.throttle = function(func, wait) {
                    var context, args, timeout, result, previous = 0,
                        later = function() {
                            previous = new Date, timeout = null, result = func.apply(context, args)
                        };
                    return function() {
                        var now = new Date,
                            remaining = wait - (now - previous);
                        return context = this, args = arguments, 0 >= remaining ? (clearTimeout(timeout), timeout = null, previous = now, result = func.apply(context, args)) : timeout || (timeout = setTimeout(later, remaining)), result
                    }
                }, _.debounce = function(func, wait, immediate) {
                    var timeout, result;
                    return function() {
                        var context = this,
                            args = arguments,
                            later = function() {
                                timeout = null, immediate || (result = func.apply(context, args))
                            },
                            callNow = immediate && !timeout;
                        return clearTimeout(timeout), timeout = setTimeout(later, wait), callNow && (result = func.apply(context, args)), result
                    }
                }, _.once = function(func) {
                    var memo, ran = !1;
                    return function() {
                        return ran ? memo : (ran = !0, memo = func.apply(this, arguments), func = null, memo)
                    }
                }, _.wrap = function(func, wrapper) {
                    return function() {
                        var args = [func];
                        return push.apply(args, arguments), wrapper.apply(this, args)
                    }
                }, _.compose = function() {
                    var funcs = arguments;
                    return function() {
                        for (var args = arguments, i = funcs.length - 1; i >= 0; i--) args = [funcs[i].apply(this, args)];
                        return args[0]
                    }
                }, _.after = function(times, func) {
                    return 0 >= times ? func() : function() {
                        return --times < 1 ? func.apply(this, arguments) : void 0
                    }
                }, _.keys = nativeKeys || function(obj) {
                    if (obj !== Object(obj)) throw new TypeError("Invalid object");
                    var keys = [];
                    for (var key in obj) _.has(obj, key) && (keys[keys.length] = key);
                    return keys
                }, _.values = function(obj) {
                    var values = [];
                    for (var key in obj) _.has(obj, key) && values.push(obj[key]);
                    return values
                }, _.pairs = function(obj) {
                    var pairs = [];
                    for (var key in obj) _.has(obj, key) && pairs.push([key, obj[key]]);
                    return pairs
                }, _.invert = function(obj) {
                    var result = {};
                    for (var key in obj) _.has(obj, key) && (result[obj[key]] = key);
                    return result
                }, _.functions = _.methods = function(obj) {
                    var names = [];
                    for (var key in obj) _.isFunction(obj[key]) && names.push(key);
                    return names.sort()
                }, _.extend = function(obj) {
                    return each(slice.call(arguments, 1), function(source) {
                        if (source)
                            for (var prop in source) obj[prop] = source[prop]
                    }), obj
                }, _.pick = function(obj) {
                    var copy = {},
                        keys = concat.apply(ArrayProto, slice.call(arguments, 1));
                    return each(keys, function(key) {
                        key in obj && (copy[key] = obj[key])
                    }), copy
                }, _.omit = function(obj) {
                    var copy = {},
                        keys = concat.apply(ArrayProto, slice.call(arguments, 1));
                    for (var key in obj) _.contains(keys, key) || (copy[key] = obj[key]);
                    return copy
                }, _.defaults = function(obj) {
                    return each(slice.call(arguments, 1), function(source) {
                        if (source)
                            for (var prop in source) null == obj[prop] && (obj[prop] = source[prop])
                    }), obj
                }, _.clone = function(obj) {
                    return _.isObject(obj) ? _.isArray(obj) ? obj.slice() : _.extend({}, obj) : obj
                }, _.tap = function(obj, interceptor) {
                    return interceptor(obj), obj
                };
                var eq = function(a, b, aStack, bStack) {
                    if (a === b) return 0 !== a || 1 / a == 1 / b;
                    if (null == a || null == b) return a === b;
                    a instanceof _ && (a = a._wrapped), b instanceof _ && (b = b._wrapped);
                    var className = toString.call(a);
                    if (className != toString.call(b)) return !1;
                    switch (className) {
                        case "[object String]":
                            return a == String(b);
                        case "[object Number]":
                            return a != +a ? b != +b : 0 == a ? 1 / a == 1 / b : a == +b;
                        case "[object Date]":
                        case "[object Boolean]":
                            return +a == +b;
                        case "[object RegExp]":
                            return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase
                    }
                    if ("object" != typeof a || "object" != typeof b) return !1;
                    for (var length = aStack.length; length--;)
                        if (aStack[length] == a) return bStack[length] == b;
                    aStack.push(a), bStack.push(b);
                    var size = 0,
                        result = !0;
                    if ("[object Array]" == className) {
                        if (size = a.length, result = size == b.length)
                            for (; size-- && (result = eq(a[size], b[size], aStack, bStack)););
                    } else {
                        var aCtor = a.constructor,
                            bCtor = b.constructor;
                        if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor)) return !1;
                        for (var key in a)
                            if (_.has(a, key) && (size++, !(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack)))) break;
                        if (result) {
                            for (key in b)
                                if (_.has(b, key) && !size--) break;
                            result = !size
                        }
                    }
                    return aStack.pop(), bStack.pop(), result
                };
                _.isEqual = function(a, b) {
                    return eq(a, b, [], [])
                }, _.isEmpty = function(obj) {
                    if (null == obj) return !0;
                    if (_.isArray(obj) || _.isString(obj)) return 0 === obj.length;
                    for (var key in obj)
                        if (_.has(obj, key)) return !1;
                    return !0
                }, _.isElement = function(obj) {
                    return !(!obj || 1 !== obj.nodeType)
                }, _.isArray = nativeIsArray || function(obj) {
                    return "[object Array]" == toString.call(obj)
                }, _.isObject = function(obj) {
                    return obj === Object(obj)
                }, each(["Arguments", "Function", "String", "Number", "Date", "RegExp"], function(name) {
                    _["is" + name] = function(obj) {
                        return toString.call(obj) == "[object " + name + "]"
                    }
                }), _.isArguments(arguments) || (_.isArguments = function(obj) {
                    return !(!obj || !_.has(obj, "callee"))
                }), "function" != typeof /./ && (_.isFunction = function(obj) {
                    return "function" == typeof obj
                }), _.isFinite = function(obj) {
                    return isFinite(obj) && !isNaN(parseFloat(obj))
                }, _.isNaN = function(obj) {
                    return _.isNumber(obj) && obj != +obj
                }, _.isBoolean = function(obj) {
                    return obj === !0 || obj === !1 || "[object Boolean]" == toString.call(obj)
                }, _.isNull = function(obj) {
                    return null === obj
                }, _.isUndefined = function(obj) {
                    return void 0 === obj
                }, _.has = function(obj, key) {
                    return hasOwnProperty.call(obj, key)
                }, _.noConflict = function() {
                    return root._ = previousUnderscore, this
                }, _.identity = function(value) {
                    return value
                }, _.times = function(n, iterator, context) {
                    for (var accum = Array(n), i = 0; n > i; i++) accum[i] = iterator.call(context, i);
                    return accum
                }, _.random = function(min, max) {
                    return null == max && (max = min, min = 0), min + Math.floor(Math.random() * (max - min + 1))
                };
                var entityMap = {
                    escape: {
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#x27;",
                        "/": "&#x2F;"
                    }
                };
                entityMap.unescape = _.invert(entityMap.escape);
                var entityRegexes = {
                    escape: new RegExp("[" + _.keys(entityMap.escape).join("") + "]", "g"),
                    unescape: new RegExp("(" + _.keys(entityMap.unescape).join("|") + ")", "g")
                };
                _.each(["escape", "unescape"], function(method) {
                    _[method] = function(string) {
                        return null == string ? "" : ("" + string).replace(entityRegexes[method], function(match) {
                            return entityMap[method][match]
                        })
                    }
                }), _.result = function(object, property) {
                    if (null == object) return null;
                    var value = object[property];
                    return _.isFunction(value) ? value.call(object) : value
                }, _.mixin = function(obj) {
                    each(_.functions(obj), function(name) {
                        var func = _[name] = obj[name];
                        _.prototype[name] = function() {
                            var args = [this._wrapped];
                            return push.apply(args, arguments), result.call(this, func.apply(_, args))
                        }
                    })
                };
                var idCounter = 0;
                _.uniqueId = function(prefix) {
                    var id = ++idCounter + "";
                    return prefix ? prefix + id : id
                }, _.templateSettings = {
                    evaluate: /<%([\s\S]+?)%>/g,
                    interpolate: /<%=([\s\S]+?)%>/g,
                    escape: /<%-([\s\S]+?)%>/g
                };
                var noMatch = /(.)^/,
                    escapes = {
                        "'": "'",
                        "\\": "\\",
                        "\r": "r",
                        "\n": "n",
                        "	": "t",
                        "\u2028": "u2028",
                        "\u2029": "u2029"
                    },
                    escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
                _.template = function(text, data, settings) {
                    var render;
                    settings = _.defaults({}, settings, _.templateSettings);
                    var matcher = new RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join("|") + "|$", "g"),
                        index = 0,
                        source = "__p+='";
                    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                        return source += text.slice(index, offset).replace(escaper, function(match) {
                            return "\\" + escapes[match]
                        }), escape && (source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'"), interpolate && (source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'"), evaluate && (source += "';\n" + evaluate + "\n__p+='"), index = offset + match.length, match
                    }), source += "';\n", settings.variable || (source = "with(obj||{}){\n" + source + "}\n"), source = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
                    try {
                        render = new Function(settings.variable || "obj", "_", source)
                    } catch (e) {
                        throw e.source = source, e
                    }
                    if (data) return render(data, _);
                    var template = function(data) {
                        return render.call(this, data, _)
                    };
                    return template.source = "function(" + (settings.variable || "obj") + "){\n" + source + "}", template
                }, _.chain = function(obj) {
                    return _(obj).chain()
                };
                var result = function(obj) {
                    return this._chain ? _(obj).chain() : obj
                };
                _.mixin(_), each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
                    var method = ArrayProto[name];
                    _.prototype[name] = function() {
                        var obj = this._wrapped;
                        return method.apply(obj, arguments), "shift" != name && "splice" != name || 0 !== obj.length || delete obj[0], result.call(this, obj)
                    }
                }), each(["concat", "join", "slice"], function(name) {
                    var method = ArrayProto[name];
                    _.prototype[name] = function() {
                        return result.call(this, method.apply(this._wrapped, arguments))
                    }
                }), _.extend(_.prototype, {
                    chain: function() {
                        return this._chain = !0, this
                    },
                    value: function() {
                        return this._wrapped
                    }
                })
            }).call(this)
        }, {}],
        119: [function(require, module, exports) {
            function callOrReturn(value) {
                return "function" == typeof value ? value() : value
            }
            exports.none = Object.create({
                value: function() {
                    throw new Error("Called value on none")
                },
                isNone: function() {
                    return !0
                },
                isSome: function() {
                    return !1
                },
                map: function() {
                    return exports.none
                },
                flatMap: function() {
                    return exports.none
                },
                toArray: function() {
                    return []
                },
                orElse: callOrReturn,
                valueOrElse: callOrReturn
            }), exports.some = function(value) {
                return new Some(value)
            };
            var Some = function(value) {
                this._value = value
            };
            Some.prototype.value = function() {
                return this._value
            }, Some.prototype.isNone = function() {
                return !1
            }, Some.prototype.isSome = function() {
                return !0
            }, Some.prototype.map = function(func) {
                return new Some(func(this._value))
            }, Some.prototype.flatMap = function(func) {
                return func(this._value)
            }, Some.prototype.toArray = function() {
                return [this._value]
            }, Some.prototype.orElse = function(value) {
                return this
            }, Some.prototype.valueOrElse = function(value) {
                return this._value
            }, exports.isOption = function(value) {
                return value === exports.none || value instanceof Some
            }, exports.fromNullable = function(value) {
                return null == value ? exports.none : new Some(value)
            }
        }, {}],
        120: [function(require, module, exports) {
            "use strict";
            var assign = require("./lib/utils/common").assign,
                deflate = require("./lib/deflate"),
                inflate = require("./lib/inflate"),
                constants = require("./lib/zlib/constants"),
                pako = {};
            assign(pako, deflate, inflate, constants), module.exports = pako
        }, {
            "./lib/deflate": 121,
            "./lib/inflate": 122,
            "./lib/utils/common": 123,
            "./lib/zlib/constants": 126
        }],
        121: [function(require, module, exports) {
            "use strict";

            function Deflate(options) {
                if (!(this instanceof Deflate)) return new Deflate(options);
                this.options = utils.assign({
                    level: Z_DEFAULT_COMPRESSION,
                    method: Z_DEFLATED,
                    chunkSize: 16384,
                    windowBits: 15,
                    memLevel: 8,
                    strategy: Z_DEFAULT_STRATEGY,
                    to: ""
                }, options || {});
                var opt = this.options;
                opt.raw && opt.windowBits > 0 ? opt.windowBits = -opt.windowBits : opt.gzip && opt.windowBits > 0 && opt.windowBits < 16 && (opt.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new ZStream, this.strm.avail_out = 0;
                var status = zlib_deflate.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
                if (status !== Z_OK) throw new Error(msg[status]);
                if (opt.header && zlib_deflate.deflateSetHeader(this.strm, opt.header), opt.dictionary) {
                    var dict;
                    if (dict = "string" == typeof opt.dictionary ? strings.string2buf(opt.dictionary) : "[object ArrayBuffer]" === toString.call(opt.dictionary) ? new Uint8Array(opt.dictionary) : opt.dictionary, status = zlib_deflate.deflateSetDictionary(this.strm, dict), status !== Z_OK) throw new Error(msg[status]);
                    this._dict_set = !0
                }
            }

            function deflate(input, options) {
                var deflator = new Deflate(options);
                if (deflator.push(input, !0), deflator.err) throw deflator.msg;
                return deflator.result
            }

            function deflateRaw(input, options) {
                return options = options || {}, options.raw = !0, deflate(input, options)
            }

            function gzip(input, options) {
                return options = options || {}, options.gzip = !0, deflate(input, options)
            }
            var zlib_deflate = require("./zlib/deflate"),
                utils = require("./utils/common"),
                strings = require("./utils/strings"),
                msg = require("./zlib/messages"),
                ZStream = require("./zlib/zstream"),
                toString = Object.prototype.toString,
                Z_NO_FLUSH = 0,
                Z_FINISH = 4,
                Z_OK = 0,
                Z_STREAM_END = 1,
                Z_SYNC_FLUSH = 2,
                Z_DEFAULT_COMPRESSION = -1,
                Z_DEFAULT_STRATEGY = 0,
                Z_DEFLATED = 8;
            Deflate.prototype.push = function(data, mode) {
                var status, _mode, strm = this.strm,
                    chunkSize = this.options.chunkSize;
                if (this.ended) return !1;
                _mode = mode === ~~mode ? mode : mode === !0 ? Z_FINISH : Z_NO_FLUSH, "string" == typeof data ? strm.input = strings.string2buf(data) : "[object ArrayBuffer]" === toString.call(data) ? strm.input = new Uint8Array(data) : strm.input = data, strm.next_in = 0, strm.avail_in = strm.input.length;
                do {
                    if (0 === strm.avail_out && (strm.output = new utils.Buf8(chunkSize), strm.next_out = 0, strm.avail_out = chunkSize), status = zlib_deflate.deflate(strm, _mode), status !== Z_STREAM_END && status !== Z_OK) return this.onEnd(status), this.ended = !0, !1;
                    (0 === strm.avail_out || 0 === strm.avail_in && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) && ("string" === this.options.to ? this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out))) : this.onData(utils.shrinkBuf(strm.output, strm.next_out)))
                } while ((strm.avail_in > 0 || 0 === strm.avail_out) && status !== Z_STREAM_END);
                return _mode === Z_FINISH ? (status = zlib_deflate.deflateEnd(this.strm), this.onEnd(status), this.ended = !0, status === Z_OK) : _mode === Z_SYNC_FLUSH ? (this.onEnd(Z_OK), strm.avail_out = 0, !0) : !0
            }, Deflate.prototype.onData = function(chunk) {
                this.chunks.push(chunk)
            }, Deflate.prototype.onEnd = function(status) {
                status === Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = utils.flattenChunks(this.chunks)), this.chunks = [], this.err = status, this.msg = this.strm.msg
            }, exports.Deflate = Deflate, exports.deflate = deflate, exports.deflateRaw = deflateRaw, exports.gzip = gzip
        }, {
            "./utils/common": 123,
            "./utils/strings": 124,
            "./zlib/deflate": 128,
            "./zlib/messages": 133,
            "./zlib/zstream": 135
        }],
        122: [function(require, module, exports) {
            "use strict";

            function Inflate(options) {
                if (!(this instanceof Inflate)) return new Inflate(options);
                this.options = utils.assign({
                    chunkSize: 16384,
                    windowBits: 0,
                    to: ""
                }, options || {});
                var opt = this.options;
                opt.raw && opt.windowBits >= 0 && opt.windowBits < 16 && (opt.windowBits = -opt.windowBits, 0 === opt.windowBits && (opt.windowBits = -15)), !(opt.windowBits >= 0 && opt.windowBits < 16) || options && options.windowBits || (opt.windowBits += 32), opt.windowBits > 15 && opt.windowBits < 48 && 0 === (15 & opt.windowBits) && (opt.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new ZStream, this.strm.avail_out = 0;
                var status = zlib_inflate.inflateInit2(this.strm, opt.windowBits);
                if (status !== c.Z_OK) throw new Error(msg[status]);
                this.header = new GZheader, zlib_inflate.inflateGetHeader(this.strm, this.header)
            }

            function inflate(input, options) {
                var inflator = new Inflate(options);
                if (inflator.push(input, !0), inflator.err) throw inflator.msg;
                return inflator.result
            }

            function inflateRaw(input, options) {
                return options = options || {}, options.raw = !0, inflate(input, options)
            }
            var zlib_inflate = require("./zlib/inflate"),
                utils = require("./utils/common"),
                strings = require("./utils/strings"),
                c = require("./zlib/constants"),
                msg = require("./zlib/messages"),
                ZStream = require("./zlib/zstream"),
                GZheader = require("./zlib/gzheader"),
                toString = Object.prototype.toString;
            Inflate.prototype.push = function(data, mode) {
                var status, _mode, next_out_utf8, tail, utf8str, dict, strm = this.strm,
                    chunkSize = this.options.chunkSize,
                    dictionary = this.options.dictionary,
                    allowBufError = !1;
                if (this.ended) return !1;
                _mode = mode === ~~mode ? mode : mode === !0 ? c.Z_FINISH : c.Z_NO_FLUSH, "string" == typeof data ? strm.input = strings.binstring2buf(data) : "[object ArrayBuffer]" === toString.call(data) ? strm.input = new Uint8Array(data) : strm.input = data, strm.next_in = 0, strm.avail_in = strm.input.length;
                do {
                    if (0 === strm.avail_out && (strm.output = new utils.Buf8(chunkSize), strm.next_out = 0, strm.avail_out = chunkSize), status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH), status === c.Z_NEED_DICT && dictionary && (dict = "string" == typeof dictionary ? strings.string2buf(dictionary) : "[object ArrayBuffer]" === toString.call(dictionary) ? new Uint8Array(dictionary) : dictionary, status = zlib_inflate.inflateSetDictionary(this.strm, dict)), status === c.Z_BUF_ERROR && allowBufError === !0 && (status = c.Z_OK, allowBufError = !1), status !== c.Z_STREAM_END && status !== c.Z_OK) return this.onEnd(status), this.ended = !0, !1;
                    strm.next_out && (0 === strm.avail_out || status === c.Z_STREAM_END || 0 === strm.avail_in && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) && ("string" === this.options.to ? (next_out_utf8 = strings.utf8border(strm.output, strm.next_out), tail = strm.next_out - next_out_utf8, utf8str = strings.buf2string(strm.output, next_out_utf8), strm.next_out = tail, strm.avail_out = chunkSize - tail, tail && utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0), this.onData(utf8str)) : this.onData(utils.shrinkBuf(strm.output, strm.next_out))), 0 === strm.avail_in && 0 === strm.avail_out && (allowBufError = !0)
                } while ((strm.avail_in > 0 || 0 === strm.avail_out) && status !== c.Z_STREAM_END);
                return status === c.Z_STREAM_END && (_mode = c.Z_FINISH), _mode === c.Z_FINISH ? (status = zlib_inflate.inflateEnd(this.strm), this.onEnd(status), this.ended = !0, status === c.Z_OK) : _mode === c.Z_SYNC_FLUSH ? (this.onEnd(c.Z_OK), strm.avail_out = 0, !0) : !0
            }, Inflate.prototype.onData = function(chunk) {
                this.chunks.push(chunk)
            }, Inflate.prototype.onEnd = function(status) {
                status === c.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = utils.flattenChunks(this.chunks)), this.chunks = [], this.err = status, this.msg = this.strm.msg
            }, exports.Inflate = Inflate, exports.inflate = inflate, exports.inflateRaw = inflateRaw, exports.ungzip = inflate
        }, {
            "./utils/common": 123,
            "./utils/strings": 124,
            "./zlib/constants": 126,
            "./zlib/gzheader": 129,
            "./zlib/inflate": 131,
            "./zlib/messages": 133,
            "./zlib/zstream": 135
        }],
        123: [function(require, module, exports) {
            "use strict";
            var TYPED_OK = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
            exports.assign = function(obj) {
                for (var sources = Array.prototype.slice.call(arguments, 1); sources.length;) {
                    var source = sources.shift();
                    if (source) {
                        if ("object" != typeof source) throw new TypeError(source + "must be non-object");
                        for (var p in source) source.hasOwnProperty(p) && (obj[p] = source[p])
                    }
                }
                return obj
            }, exports.shrinkBuf = function(buf, size) {
                return buf.length === size ? buf : buf.subarray ? buf.subarray(0, size) : (buf.length = size, buf)
            };
            var fnTyped = {
                    arraySet: function(dest, src, src_offs, len, dest_offs) {
                        if (src.subarray && dest.subarray) return void dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
                        for (var i = 0; len > i; i++) dest[dest_offs + i] = src[src_offs + i]
                    },
                    flattenChunks: function(chunks) {
                        var i, l, len, pos, chunk, result;
                        for (len = 0, i = 0, l = chunks.length; l > i; i++) len += chunks[i].length;
                        for (result = new Uint8Array(len), pos = 0, i = 0, l = chunks.length; l > i; i++) chunk = chunks[i], result.set(chunk, pos), pos += chunk.length;
                        return result
                    }
                },
                fnUntyped = {
                    arraySet: function(dest, src, src_offs, len, dest_offs) {
                        for (var i = 0; len > i; i++) dest[dest_offs + i] = src[src_offs + i]
                    },
                    flattenChunks: function(chunks) {
                        return [].concat.apply([], chunks)
                    }
                };
            exports.setTyped = function(on) {
                on ? (exports.Buf8 = Uint8Array, exports.Buf16 = Uint16Array, exports.Buf32 = Int32Array, exports.assign(exports, fnTyped)) : (exports.Buf8 = Array, exports.Buf16 = Array, exports.Buf32 = Array, exports.assign(exports, fnUntyped))
            }, exports.setTyped(TYPED_OK)
        }, {}],
        124: [function(require, module, exports) {
            "use strict";

            function buf2binstring(buf, len) {
                if (65537 > len && (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK)) return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
                for (var result = "", i = 0; len > i; i++) result += String.fromCharCode(buf[i]);
                return result
            }
            var utils = require("./common"),
                STR_APPLY_OK = !0,
                STR_APPLY_UIA_OK = !0;
            try {
                String.fromCharCode.apply(null, [0])
            } catch (__) {
                STR_APPLY_OK = !1
            }
            try {
                String.fromCharCode.apply(null, new Uint8Array(1))
            } catch (__) {
                STR_APPLY_UIA_OK = !1
            }
            for (var _utf8len = new utils.Buf8(256), q = 0; 256 > q; q++) _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
            _utf8len[254] = _utf8len[254] = 1, exports.string2buf = function(str) {
                var buf, c, c2, m_pos, i, str_len = str.length,
                    buf_len = 0;
                for (m_pos = 0; str_len > m_pos; m_pos++) c = str.charCodeAt(m_pos), 55296 === (64512 & c) && str_len > m_pos + 1 && (c2 = str.charCodeAt(m_pos + 1), 56320 === (64512 & c2) && (c = 65536 + (c - 55296 << 10) + (c2 - 56320), m_pos++)), buf_len += 128 > c ? 1 : 2048 > c ? 2 : 65536 > c ? 3 : 4;
                for (buf = new utils.Buf8(buf_len), i = 0, m_pos = 0; buf_len > i; m_pos++) c = str.charCodeAt(m_pos), 55296 === (64512 & c) && str_len > m_pos + 1 && (c2 = str.charCodeAt(m_pos + 1), 56320 === (64512 & c2) && (c = 65536 + (c - 55296 << 10) + (c2 - 56320), m_pos++)), 128 > c ? buf[i++] = c : 2048 > c ? (buf[i++] = 192 | c >>> 6, buf[i++] = 128 | 63 & c) : 65536 > c ? (buf[i++] = 224 | c >>> 12, buf[i++] = 128 | c >>> 6 & 63, buf[i++] = 128 | 63 & c) : (buf[i++] = 240 | c >>> 18, buf[i++] = 128 | c >>> 12 & 63, buf[i++] = 128 | c >>> 6 & 63, buf[i++] = 128 | 63 & c);
                return buf
            }, exports.buf2binstring = function(buf) {
                return buf2binstring(buf, buf.length)
            }, exports.binstring2buf = function(str) {
                for (var buf = new utils.Buf8(str.length), i = 0, len = buf.length; len > i; i++) buf[i] = str.charCodeAt(i);
                return buf
            }, exports.buf2string = function(buf, max) {
                var i, out, c, c_len, len = max || buf.length,
                    utf16buf = new Array(2 * len);
                for (out = 0, i = 0; len > i;)
                    if (c = buf[i++], 128 > c) utf16buf[out++] = c;
                    else if (c_len = _utf8len[c], c_len > 4) utf16buf[out++] = 65533, i += c_len - 1;
                else {
                    for (c &= 2 === c_len ? 31 : 3 === c_len ? 15 : 7; c_len > 1 && len > i;) c = c << 6 | 63 & buf[i++], c_len--;
                    c_len > 1 ? utf16buf[out++] = 65533 : 65536 > c ? utf16buf[out++] = c : (c -= 65536, utf16buf[out++] = 55296 | c >> 10 & 1023, utf16buf[out++] = 56320 | 1023 & c)
                }
                return buf2binstring(utf16buf, out)
            }, exports.utf8border = function(buf, max) {
                var pos;
                for (max = max || buf.length, max > buf.length && (max = buf.length), pos = max - 1; pos >= 0 && 128 === (192 & buf[pos]);) pos--;
                return 0 > pos ? max : 0 === pos ? max : pos + _utf8len[buf[pos]] > max ? pos : max
            }
        }, {
            "./common": 123
        }],
        125: [function(require, module, exports) {
            "use strict";

            function adler32(adler, buf, len, pos) {
                for (var s1 = 65535 & adler | 0, s2 = adler >>> 16 & 65535 | 0, n = 0; 0 !== len;) {
                    n = len > 2e3 ? 2e3 : len, len -= n;
                    do s1 = s1 + buf[pos++] | 0, s2 = s2 + s1 | 0; while (--n);
                    s1 %= 65521, s2 %= 65521
                }
                return s1 | s2 << 16 | 0
            }
            module.exports = adler32
        }, {}],
        126: [function(require, module, exports) {
            "use strict";
            module.exports = {
                Z_NO_FLUSH: 0,
                Z_PARTIAL_FLUSH: 1,
                Z_SYNC_FLUSH: 2,
                Z_FULL_FLUSH: 3,
                Z_FINISH: 4,
                Z_BLOCK: 5,
                Z_TREES: 6,
                Z_OK: 0,
                Z_STREAM_END: 1,
                Z_NEED_DICT: 2,
                Z_ERRNO: -1,
                Z_STREAM_ERROR: -2,
                Z_DATA_ERROR: -3,
                Z_BUF_ERROR: -5,
                Z_NO_COMPRESSION: 0,
                Z_BEST_SPEED: 1,
                Z_BEST_COMPRESSION: 9,
                Z_DEFAULT_COMPRESSION: -1,
                Z_FILTERED: 1,
                Z_HUFFMAN_ONLY: 2,
                Z_RLE: 3,
                Z_FIXED: 4,
                Z_DEFAULT_STRATEGY: 0,
                Z_BINARY: 0,
                Z_TEXT: 1,
                Z_UNKNOWN: 2,
                Z_DEFLATED: 8
            }
        }, {}],
        127: [function(require, module, exports) {
            "use strict";

            function makeTable() {
                for (var c, table = [], n = 0; 256 > n; n++) {
                    c = n;
                    for (var k = 0; 8 > k; k++) c = 1 & c ? 3988292384 ^ c >>> 1 : c >>> 1;
                    table[n] = c
                }
                return table
            }

            function crc32(crc, buf, len, pos) {
                var t = crcTable,
                    end = pos + len;
                crc ^= -1;
                for (var i = pos; end > i; i++) crc = crc >>> 8 ^ t[255 & (crc ^ buf[i])];
                return -1 ^ crc
            }
            var crcTable = makeTable();
            module.exports = crc32
        }, {}],
        128: [function(require, module, exports) {
            "use strict";

            function err(strm, errorCode) {
                return strm.msg = msg[errorCode], errorCode
            }

            function rank(f) {
                return (f << 1) - (f > 4 ? 9 : 0)
            }

            function zero(buf) {
                for (var len = buf.length; --len >= 0;) buf[len] = 0
            }

            function flush_pending(strm) {
                var s = strm.state,
                    len = s.pending;
                len > strm.avail_out && (len = strm.avail_out), 0 !== len && (utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out), strm.next_out += len, s.pending_out += len, strm.total_out += len, strm.avail_out -= len, s.pending -= len, 0 === s.pending && (s.pending_out = 0))
            }

            function flush_block_only(s, last) {
                trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last), s.block_start = s.strstart, flush_pending(s.strm)
            }

            function put_byte(s, b) {
                s.pending_buf[s.pending++] = b
            }

            function putShortMSB(s, b) {
                s.pending_buf[s.pending++] = b >>> 8 & 255, s.pending_buf[s.pending++] = 255 & b
            }

            function read_buf(strm, buf, start, size) {
                var len = strm.avail_in;
                return len > size && (len = size), 0 === len ? 0 : (strm.avail_in -= len, utils.arraySet(buf, strm.input, strm.next_in, len, start), 1 === strm.state.wrap ? strm.adler = adler32(strm.adler, buf, len, start) : 2 === strm.state.wrap && (strm.adler = crc32(strm.adler, buf, len, start)), strm.next_in += len, strm.total_in += len, len)
            }

            function longest_match(s, cur_match) {
                var match, len, chain_length = s.max_chain_length,
                    scan = s.strstart,
                    best_len = s.prev_length,
                    nice_match = s.nice_match,
                    limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0,
                    _win = s.window,
                    wmask = s.w_mask,
                    prev = s.prev,
                    strend = s.strstart + MAX_MATCH,
                    scan_end1 = _win[scan + best_len - 1],
                    scan_end = _win[scan + best_len];
                s.prev_length >= s.good_match && (chain_length >>= 2), nice_match > s.lookahead && (nice_match = s.lookahead);
                do
                    if (match = cur_match, _win[match + best_len] === scan_end && _win[match + best_len - 1] === scan_end1 && _win[match] === _win[scan] && _win[++match] === _win[scan + 1]) {
                        scan += 2, match++;
                        do; while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && strend > scan);
                        if (len = MAX_MATCH - (strend - scan), scan = strend - MAX_MATCH, len > best_len) {
                            if (s.match_start = cur_match, best_len = len, len >= nice_match) break;
                            scan_end1 = _win[scan + best_len - 1], scan_end = _win[scan + best_len]
                        }
                    } while ((cur_match = prev[cur_match & wmask]) > limit && 0 !== --chain_length);
                return best_len <= s.lookahead ? best_len : s.lookahead
            }

            function fill_window(s) {
                var p, n, m, more, str, _w_size = s.w_size;
                do {
                    if (more = s.window_size - s.lookahead - s.strstart, s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
                        utils.arraySet(s.window, s.window, _w_size, _w_size, 0), s.match_start -= _w_size, s.strstart -= _w_size, s.block_start -= _w_size, n = s.hash_size, p = n;
                        do m = s.head[--p], s.head[p] = m >= _w_size ? m - _w_size : 0; while (--n);
                        n = _w_size, p = n;
                        do m = s.prev[--p], s.prev[p] = m >= _w_size ? m - _w_size : 0; while (--n);
                        more += _w_size
                    }
                    if (0 === s.strm.avail_in) break;
                    if (n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more), s.lookahead += n, s.lookahead + s.insert >= MIN_MATCH)
                        for (str = s.strstart - s.insert, s.ins_h = s.window[str], s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask; s.insert && (s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask, s.prev[str & s.w_mask] = s.head[s.ins_h], s.head[s.ins_h] = str, str++, s.insert--, !(s.lookahead + s.insert < MIN_MATCH)););
                } while (s.lookahead < MIN_LOOKAHEAD && 0 !== s.strm.avail_in)
            }

            function deflate_stored(s, flush) {
                var max_block_size = 65535;
                for (max_block_size > s.pending_buf_size - 5 && (max_block_size = s.pending_buf_size - 5);;) {
                    if (s.lookahead <= 1) {
                        if (fill_window(s), 0 === s.lookahead && flush === Z_NO_FLUSH) return BS_NEED_MORE;
                        if (0 === s.lookahead) break
                    }
                    s.strstart += s.lookahead, s.lookahead = 0;
                    var max_start = s.block_start + max_block_size;
                    if ((0 === s.strstart || s.strstart >= max_start) && (s.lookahead = s.strstart - max_start, s.strstart = max_start, flush_block_only(s, !1), 0 === s.strm.avail_out)) return BS_NEED_MORE;
                    if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD && (flush_block_only(s, !1), 0 === s.strm.avail_out)) return BS_NEED_MORE
                }
                return s.insert = 0, flush === Z_FINISH ? (flush_block_only(s, !0), 0 === s.strm.avail_out ? BS_FINISH_STARTED : BS_FINISH_DONE) : s.strstart > s.block_start && (flush_block_only(s, !1), 0 === s.strm.avail_out) ? BS_NEED_MORE : BS_NEED_MORE
            }

            function deflate_fast(s, flush) {
                for (var hash_head, bflush;;) {
                    if (s.lookahead < MIN_LOOKAHEAD) {
                        if (fill_window(s), s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
                        if (0 === s.lookahead) break
                    }
                    if (hash_head = 0, s.lookahead >= MIN_MATCH && (s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask, hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h], s.head[s.ins_h] = s.strstart), 0 !== hash_head && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD && (s.match_length = longest_match(s, hash_head)), s.match_length >= MIN_MATCH)
                        if (bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH), s.lookahead -= s.match_length, s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
                            s.match_length--;
                            do s.strstart++, s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask, hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h], s.head[s.ins_h] = s.strstart; while (0 !== --s.match_length);
                            s.strstart++
                        } else s.strstart += s.match_length, s.match_length = 0, s.ins_h = s.window[s.strstart], s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
                    else bflush = trees._tr_tally(s, 0, s.window[s.strstart]), s.lookahead--, s.strstart++;
                    if (bflush && (flush_block_only(s, !1), 0 === s.strm.avail_out)) return BS_NEED_MORE
                }
                return s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1, flush === Z_FINISH ? (flush_block_only(s, !0), 0 === s.strm.avail_out ? BS_FINISH_STARTED : BS_FINISH_DONE) : s.last_lit && (flush_block_only(s, !1), 0 === s.strm.avail_out) ? BS_NEED_MORE : BS_BLOCK_DONE
            }

            function deflate_slow(s, flush) {
                for (var hash_head, bflush, max_insert;;) {
                    if (s.lookahead < MIN_LOOKAHEAD) {
                        if (fill_window(s), s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
                        if (0 === s.lookahead) break
                    }
                    if (hash_head = 0, s.lookahead >= MIN_MATCH && (s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask, hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h], s.head[s.ins_h] = s.strstart), s.prev_length = s.match_length, s.prev_match = s.match_start, s.match_length = MIN_MATCH - 1, 0 !== hash_head && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD && (s.match_length = longest_match(s, hash_head), s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096) && (s.match_length = MIN_MATCH - 1)), s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
                        max_insert = s.strstart + s.lookahead - MIN_MATCH, bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH), s.lookahead -= s.prev_length - 1, s.prev_length -= 2;
                        do ++s.strstart <= max_insert && (s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask, hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h], s.head[s.ins_h] = s.strstart); while (0 !== --s.prev_length);
                        if (s.match_available = 0, s.match_length = MIN_MATCH - 1, s.strstart++, bflush && (flush_block_only(s, !1), 0 === s.strm.avail_out)) return BS_NEED_MORE
                    } else if (s.match_available) {
                        if (bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]), bflush && flush_block_only(s, !1), s.strstart++, s.lookahead--, 0 === s.strm.avail_out) return BS_NEED_MORE
                    } else s.match_available = 1, s.strstart++, s.lookahead--
                }
                return s.match_available && (bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]), s.match_available = 0), s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1, flush === Z_FINISH ? (flush_block_only(s, !0), 0 === s.strm.avail_out ? BS_FINISH_STARTED : BS_FINISH_DONE) : s.last_lit && (flush_block_only(s, !1), 0 === s.strm.avail_out) ? BS_NEED_MORE : BS_BLOCK_DONE
            }

            function deflate_rle(s, flush) {
                for (var bflush, prev, scan, strend, _win = s.window;;) {
                    if (s.lookahead <= MAX_MATCH) {
                        if (fill_window(s), s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) return BS_NEED_MORE;
                        if (0 === s.lookahead) break
                    }
                    if (s.match_length = 0, s.lookahead >= MIN_MATCH && s.strstart > 0 && (scan = s.strstart - 1, prev = _win[scan], prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan])) {
                        strend = s.strstart + MAX_MATCH;
                        do; while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && strend > scan);
                        s.match_length = MAX_MATCH - (strend - scan), s.match_length > s.lookahead && (s.match_length = s.lookahead);
                    }
                    if (s.match_length >= MIN_MATCH ? (bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH), s.lookahead -= s.match_length, s.strstart += s.match_length, s.match_length = 0) : (bflush = trees._tr_tally(s, 0, s.window[s.strstart]), s.lookahead--, s.strstart++), bflush && (flush_block_only(s, !1), 0 === s.strm.avail_out)) return BS_NEED_MORE
                }
                return s.insert = 0, flush === Z_FINISH ? (flush_block_only(s, !0), 0 === s.strm.avail_out ? BS_FINISH_STARTED : BS_FINISH_DONE) : s.last_lit && (flush_block_only(s, !1), 0 === s.strm.avail_out) ? BS_NEED_MORE : BS_BLOCK_DONE
            }

            function deflate_huff(s, flush) {
                for (var bflush;;) {
                    if (0 === s.lookahead && (fill_window(s), 0 === s.lookahead)) {
                        if (flush === Z_NO_FLUSH) return BS_NEED_MORE;
                        break
                    }
                    if (s.match_length = 0, bflush = trees._tr_tally(s, 0, s.window[s.strstart]), s.lookahead--, s.strstart++, bflush && (flush_block_only(s, !1), 0 === s.strm.avail_out)) return BS_NEED_MORE
                }
                return s.insert = 0, flush === Z_FINISH ? (flush_block_only(s, !0), 0 === s.strm.avail_out ? BS_FINISH_STARTED : BS_FINISH_DONE) : s.last_lit && (flush_block_only(s, !1), 0 === s.strm.avail_out) ? BS_NEED_MORE : BS_BLOCK_DONE
            }

            function Config(good_length, max_lazy, nice_length, max_chain, func) {
                this.good_length = good_length, this.max_lazy = max_lazy, this.nice_length = nice_length, this.max_chain = max_chain, this.func = func
            }

            function lm_init(s) {
                s.window_size = 2 * s.w_size, zero(s.head), s.max_lazy_match = configuration_table[s.level].max_lazy, s.good_match = configuration_table[s.level].good_length, s.nice_match = configuration_table[s.level].nice_length, s.max_chain_length = configuration_table[s.level].max_chain, s.strstart = 0, s.block_start = 0, s.lookahead = 0, s.insert = 0, s.match_length = s.prev_length = MIN_MATCH - 1, s.match_available = 0, s.ins_h = 0
            }

            function DeflateState() {
                this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Z_DEFLATED, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new utils.Buf16(2 * HEAP_SIZE), this.dyn_dtree = new utils.Buf16(2 * (2 * D_CODES + 1)), this.bl_tree = new utils.Buf16(2 * (2 * BL_CODES + 1)), zero(this.dyn_ltree), zero(this.dyn_dtree), zero(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new utils.Buf16(MAX_BITS + 1), this.heap = new utils.Buf16(2 * L_CODES + 1), zero(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new utils.Buf16(2 * L_CODES + 1), zero(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0
            }

            function deflateResetKeep(strm) {
                var s;
                return strm && strm.state ? (strm.total_in = strm.total_out = 0, strm.data_type = Z_UNKNOWN, s = strm.state, s.pending = 0, s.pending_out = 0, s.wrap < 0 && (s.wrap = -s.wrap), s.status = s.wrap ? INIT_STATE : BUSY_STATE, strm.adler = 2 === s.wrap ? 0 : 1, s.last_flush = Z_NO_FLUSH, trees._tr_init(s), Z_OK) : err(strm, Z_STREAM_ERROR)
            }

            function deflateReset(strm) {
                var ret = deflateResetKeep(strm);
                return ret === Z_OK && lm_init(strm.state), ret
            }

            function deflateSetHeader(strm, head) {
                return strm && strm.state ? 2 !== strm.state.wrap ? Z_STREAM_ERROR : (strm.state.gzhead = head, Z_OK) : Z_STREAM_ERROR
            }

            function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
                if (!strm) return Z_STREAM_ERROR;
                var wrap = 1;
                if (level === Z_DEFAULT_COMPRESSION && (level = 6), 0 > windowBits ? (wrap = 0, windowBits = -windowBits) : windowBits > 15 && (wrap = 2, windowBits -= 16), 1 > memLevel || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || 8 > windowBits || windowBits > 15 || 0 > level || level > 9 || 0 > strategy || strategy > Z_FIXED) return err(strm, Z_STREAM_ERROR);
                8 === windowBits && (windowBits = 9);
                var s = new DeflateState;
                return strm.state = s, s.strm = strm, s.wrap = wrap, s.gzhead = null, s.w_bits = windowBits, s.w_size = 1 << s.w_bits, s.w_mask = s.w_size - 1, s.hash_bits = memLevel + 7, s.hash_size = 1 << s.hash_bits, s.hash_mask = s.hash_size - 1, s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH), s.window = new utils.Buf8(2 * s.w_size), s.head = new utils.Buf16(s.hash_size), s.prev = new utils.Buf16(s.w_size), s.lit_bufsize = 1 << memLevel + 6, s.pending_buf_size = 4 * s.lit_bufsize, s.pending_buf = new utils.Buf8(s.pending_buf_size), s.d_buf = 1 * s.lit_bufsize, s.l_buf = 3 * s.lit_bufsize, s.level = level, s.strategy = strategy, s.method = method, deflateReset(strm)
            }

            function deflateInit(strm, level) {
                return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY)
            }

            function deflate(strm, flush) {
                var old_flush, s, beg, val;
                if (!strm || !strm.state || flush > Z_BLOCK || 0 > flush) return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
                if (s = strm.state, !strm.output || !strm.input && 0 !== strm.avail_in || s.status === FINISH_STATE && flush !== Z_FINISH) return err(strm, 0 === strm.avail_out ? Z_BUF_ERROR : Z_STREAM_ERROR);
                if (s.strm = strm, old_flush = s.last_flush, s.last_flush = flush, s.status === INIT_STATE)
                    if (2 === s.wrap) strm.adler = 0, put_byte(s, 31), put_byte(s, 139), put_byte(s, 8), s.gzhead ? (put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (s.gzhead.extra ? 4 : 0) + (s.gzhead.name ? 8 : 0) + (s.gzhead.comment ? 16 : 0)), put_byte(s, 255 & s.gzhead.time), put_byte(s, s.gzhead.time >> 8 & 255), put_byte(s, s.gzhead.time >> 16 & 255), put_byte(s, s.gzhead.time >> 24 & 255), put_byte(s, 9 === s.level ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0), put_byte(s, 255 & s.gzhead.os), s.gzhead.extra && s.gzhead.extra.length && (put_byte(s, 255 & s.gzhead.extra.length), put_byte(s, s.gzhead.extra.length >> 8 & 255)), s.gzhead.hcrc && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0)), s.gzindex = 0, s.status = EXTRA_STATE) : (put_byte(s, 0), put_byte(s, 0), put_byte(s, 0), put_byte(s, 0), put_byte(s, 0), put_byte(s, 9 === s.level ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0), put_byte(s, OS_CODE), s.status = BUSY_STATE);
                    else {
                        var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8,
                            level_flags = -1;
                        level_flags = s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 0 : s.level < 6 ? 1 : 6 === s.level ? 2 : 3, header |= level_flags << 6, 0 !== s.strstart && (header |= PRESET_DICT), header += 31 - header % 31, s.status = BUSY_STATE, putShortMSB(s, header), 0 !== s.strstart && (putShortMSB(s, strm.adler >>> 16), putShortMSB(s, 65535 & strm.adler)), strm.adler = 1
                    } if (s.status === EXTRA_STATE)
                    if (s.gzhead.extra) {
                        for (beg = s.pending; s.gzindex < (65535 & s.gzhead.extra.length) && (s.pending !== s.pending_buf_size || (s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), flush_pending(strm), beg = s.pending, s.pending !== s.pending_buf_size));) put_byte(s, 255 & s.gzhead.extra[s.gzindex]), s.gzindex++;
                        s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), s.gzindex === s.gzhead.extra.length && (s.gzindex = 0, s.status = NAME_STATE)
                    } else s.status = NAME_STATE;
                if (s.status === NAME_STATE)
                    if (s.gzhead.name) {
                        beg = s.pending;
                        do {
                            if (s.pending === s.pending_buf_size && (s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), flush_pending(strm), beg = s.pending, s.pending === s.pending_buf_size)) {
                                val = 1;
                                break
                            }
                            val = s.gzindex < s.gzhead.name.length ? 255 & s.gzhead.name.charCodeAt(s.gzindex++) : 0, put_byte(s, val)
                        } while (0 !== val);
                        s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), 0 === val && (s.gzindex = 0, s.status = COMMENT_STATE)
                    } else s.status = COMMENT_STATE;
                if (s.status === COMMENT_STATE)
                    if (s.gzhead.comment) {
                        beg = s.pending;
                        do {
                            if (s.pending === s.pending_buf_size && (s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), flush_pending(strm), beg = s.pending, s.pending === s.pending_buf_size)) {
                                val = 1;
                                break
                            }
                            val = s.gzindex < s.gzhead.comment.length ? 255 & s.gzhead.comment.charCodeAt(s.gzindex++) : 0, put_byte(s, val)
                        } while (0 !== val);
                        s.gzhead.hcrc && s.pending > beg && (strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg)), 0 === val && (s.status = HCRC_STATE)
                    } else s.status = HCRC_STATE;
                if (s.status === HCRC_STATE && (s.gzhead.hcrc ? (s.pending + 2 > s.pending_buf_size && flush_pending(strm), s.pending + 2 <= s.pending_buf_size && (put_byte(s, 255 & strm.adler), put_byte(s, strm.adler >> 8 & 255), strm.adler = 0, s.status = BUSY_STATE)) : s.status = BUSY_STATE), 0 !== s.pending) {
                    if (flush_pending(strm), 0 === strm.avail_out) return s.last_flush = -1, Z_OK
                } else if (0 === strm.avail_in && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) return err(strm, Z_BUF_ERROR);
                if (s.status === FINISH_STATE && 0 !== strm.avail_in) return err(strm, Z_BUF_ERROR);
                if (0 !== strm.avail_in || 0 !== s.lookahead || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
                    var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
                    if ((bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) && (s.status = FINISH_STATE), bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) return 0 === strm.avail_out && (s.last_flush = -1), Z_OK;
                    if (bstate === BS_BLOCK_DONE && (flush === Z_PARTIAL_FLUSH ? trees._tr_align(s) : flush !== Z_BLOCK && (trees._tr_stored_block(s, 0, 0, !1), flush === Z_FULL_FLUSH && (zero(s.head), 0 === s.lookahead && (s.strstart = 0, s.block_start = 0, s.insert = 0))), flush_pending(strm), 0 === strm.avail_out)) return s.last_flush = -1, Z_OK
                }
                return flush !== Z_FINISH ? Z_OK : s.wrap <= 0 ? Z_STREAM_END : (2 === s.wrap ? (put_byte(s, 255 & strm.adler), put_byte(s, strm.adler >> 8 & 255), put_byte(s, strm.adler >> 16 & 255), put_byte(s, strm.adler >> 24 & 255), put_byte(s, 255 & strm.total_in), put_byte(s, strm.total_in >> 8 & 255), put_byte(s, strm.total_in >> 16 & 255), put_byte(s, strm.total_in >> 24 & 255)) : (putShortMSB(s, strm.adler >>> 16), putShortMSB(s, 65535 & strm.adler)), flush_pending(strm), s.wrap > 0 && (s.wrap = -s.wrap), 0 !== s.pending ? Z_OK : Z_STREAM_END)
            }

            function deflateEnd(strm) {
                var status;
                return strm && strm.state ? (status = strm.state.status, status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE ? err(strm, Z_STREAM_ERROR) : (strm.state = null, status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK)) : Z_STREAM_ERROR
            }

            function deflateSetDictionary(strm, dictionary) {
                var s, str, n, wrap, avail, next, input, tmpDict, dictLength = dictionary.length;
                if (!strm || !strm.state) return Z_STREAM_ERROR;
                if (s = strm.state, wrap = s.wrap, 2 === wrap || 1 === wrap && s.status !== INIT_STATE || s.lookahead) return Z_STREAM_ERROR;
                for (1 === wrap && (strm.adler = adler32(strm.adler, dictionary, dictLength, 0)), s.wrap = 0, dictLength >= s.w_size && (0 === wrap && (zero(s.head), s.strstart = 0, s.block_start = 0, s.insert = 0), tmpDict = new utils.Buf8(s.w_size), utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0), dictionary = tmpDict, dictLength = s.w_size), avail = strm.avail_in, next = strm.next_in, input = strm.input, strm.avail_in = dictLength, strm.next_in = 0, strm.input = dictionary, fill_window(s); s.lookahead >= MIN_MATCH;) {
                    str = s.strstart, n = s.lookahead - (MIN_MATCH - 1);
                    do s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask, s.prev[str & s.w_mask] = s.head[s.ins_h], s.head[s.ins_h] = str, str++; while (--n);
                    s.strstart = str, s.lookahead = MIN_MATCH - 1, fill_window(s)
                }
                return s.strstart += s.lookahead, s.block_start = s.strstart, s.insert = s.lookahead, s.lookahead = 0, s.match_length = s.prev_length = MIN_MATCH - 1, s.match_available = 0, strm.next_in = next, strm.input = input, strm.avail_in = avail, s.wrap = wrap, Z_OK
            }
            var configuration_table, utils = require("../utils/common"),
                trees = require("./trees"),
                adler32 = require("./adler32"),
                crc32 = require("./crc32"),
                msg = require("./messages"),
                Z_NO_FLUSH = 0,
                Z_PARTIAL_FLUSH = 1,
                Z_FULL_FLUSH = 3,
                Z_FINISH = 4,
                Z_BLOCK = 5,
                Z_OK = 0,
                Z_STREAM_END = 1,
                Z_STREAM_ERROR = -2,
                Z_DATA_ERROR = -3,
                Z_BUF_ERROR = -5,
                Z_DEFAULT_COMPRESSION = -1,
                Z_FILTERED = 1,
                Z_HUFFMAN_ONLY = 2,
                Z_RLE = 3,
                Z_FIXED = 4,
                Z_DEFAULT_STRATEGY = 0,
                Z_UNKNOWN = 2,
                Z_DEFLATED = 8,
                MAX_MEM_LEVEL = 9,
                MAX_WBITS = 15,
                DEF_MEM_LEVEL = 8,
                LENGTH_CODES = 29,
                LITERALS = 256,
                L_CODES = LITERALS + 1 + LENGTH_CODES,
                D_CODES = 30,
                BL_CODES = 19,
                HEAP_SIZE = 2 * L_CODES + 1,
                MAX_BITS = 15,
                MIN_MATCH = 3,
                MAX_MATCH = 258,
                MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1,
                PRESET_DICT = 32,
                INIT_STATE = 42,
                EXTRA_STATE = 69,
                NAME_STATE = 73,
                COMMENT_STATE = 91,
                HCRC_STATE = 103,
                BUSY_STATE = 113,
                FINISH_STATE = 666,
                BS_NEED_MORE = 1,
                BS_BLOCK_DONE = 2,
                BS_FINISH_STARTED = 3,
                BS_FINISH_DONE = 4,
                OS_CODE = 3;
            configuration_table = [new Config(0, 0, 0, 0, deflate_stored), new Config(4, 4, 8, 4, deflate_fast), new Config(4, 5, 16, 8, deflate_fast), new Config(4, 6, 32, 32, deflate_fast), new Config(4, 4, 16, 16, deflate_slow), new Config(8, 16, 32, 32, deflate_slow), new Config(8, 16, 128, 128, deflate_slow), new Config(8, 32, 128, 256, deflate_slow), new Config(32, 128, 258, 1024, deflate_slow), new Config(32, 258, 258, 4096, deflate_slow)], exports.deflateInit = deflateInit, exports.deflateInit2 = deflateInit2, exports.deflateReset = deflateReset, exports.deflateResetKeep = deflateResetKeep, exports.deflateSetHeader = deflateSetHeader, exports.deflate = deflate, exports.deflateEnd = deflateEnd, exports.deflateSetDictionary = deflateSetDictionary, exports.deflateInfo = "pako deflate (from Nodeca project)"
        }, {
            "../utils/common": 123,
            "./adler32": 125,
            "./crc32": 127,
            "./messages": 133,
            "./trees": 134
        }],
        129: [function(require, module, exports) {
            "use strict";

            function GZheader() {
                this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1
            }
            module.exports = GZheader
        }, {}],
        130: [function(require, module, exports) {
            "use strict";
            var BAD = 30,
                TYPE = 12;
            module.exports = function(strm, start) {
                var state, _in, last, _out, beg, end, dmax, wsize, whave, wnext, s_window, hold, bits, lcode, dcode, lmask, dmask, here, op, len, dist, from, from_source, input, output;
                state = strm.state, _in = strm.next_in, input = strm.input, last = _in + (strm.avail_in - 5), _out = strm.next_out, output = strm.output, beg = _out - (start - strm.avail_out), end = _out + (strm.avail_out - 257), dmax = state.dmax, wsize = state.wsize, whave = state.whave, wnext = state.wnext, s_window = state.window, hold = state.hold, bits = state.bits, lcode = state.lencode, dcode = state.distcode, lmask = (1 << state.lenbits) - 1, dmask = (1 << state.distbits) - 1;
                top: do {
                    15 > bits && (hold += input[_in++] << bits, bits += 8, hold += input[_in++] << bits, bits += 8), here = lcode[hold & lmask];
                    dolen: for (;;) {
                        if (op = here >>> 24, hold >>>= op, bits -= op, op = here >>> 16 & 255, 0 === op) output[_out++] = 65535 & here;
                        else {
                            if (!(16 & op)) {
                                if (0 === (64 & op)) {
                                    here = lcode[(65535 & here) + (hold & (1 << op) - 1)];
                                    continue dolen
                                }
                                if (32 & op) {
                                    state.mode = TYPE;
                                    break top
                                }
                                strm.msg = "invalid literal/length code", state.mode = BAD;
                                break top
                            }
                            len = 65535 & here, op &= 15, op && (op > bits && (hold += input[_in++] << bits, bits += 8), len += hold & (1 << op) - 1, hold >>>= op, bits -= op), 15 > bits && (hold += input[_in++] << bits, bits += 8, hold += input[_in++] << bits, bits += 8), here = dcode[hold & dmask];
                            dodist: for (;;) {
                                if (op = here >>> 24, hold >>>= op, bits -= op, op = here >>> 16 & 255, !(16 & op)) {
                                    if (0 === (64 & op)) {
                                        here = dcode[(65535 & here) + (hold & (1 << op) - 1)];
                                        continue dodist
                                    }
                                    strm.msg = "invalid distance code", state.mode = BAD;
                                    break top
                                }
                                if (dist = 65535 & here, op &= 15, op > bits && (hold += input[_in++] << bits, bits += 8, op > bits && (hold += input[_in++] << bits, bits += 8)), dist += hold & (1 << op) - 1, dist > dmax) {
                                    strm.msg = "invalid distance too far back", state.mode = BAD;
                                    break top
                                }
                                if (hold >>>= op, bits -= op, op = _out - beg, dist > op) {
                                    if (op = dist - op, op > whave && state.sane) {
                                        strm.msg = "invalid distance too far back", state.mode = BAD;
                                        break top
                                    }
                                    if (from = 0, from_source = s_window, 0 === wnext) {
                                        if (from += wsize - op, len > op) {
                                            len -= op;
                                            do output[_out++] = s_window[from++]; while (--op);
                                            from = _out - dist, from_source = output
                                        }
                                    } else if (op > wnext) {
                                        if (from += wsize + wnext - op, op -= wnext, len > op) {
                                            len -= op;
                                            do output[_out++] = s_window[from++]; while (--op);
                                            if (from = 0, len > wnext) {
                                                op = wnext, len -= op;
                                                do output[_out++] = s_window[from++]; while (--op);
                                                from = _out - dist, from_source = output
                                            }
                                        }
                                    } else if (from += wnext - op, len > op) {
                                        len -= op;
                                        do output[_out++] = s_window[from++]; while (--op);
                                        from = _out - dist, from_source = output
                                    }
                                    for (; len > 2;) output[_out++] = from_source[from++], output[_out++] = from_source[from++], output[_out++] = from_source[from++], len -= 3;
                                    len && (output[_out++] = from_source[from++], len > 1 && (output[_out++] = from_source[from++]))
                                } else {
                                    from = _out - dist;
                                    do output[_out++] = output[from++], output[_out++] = output[from++], output[_out++] = output[from++], len -= 3; while (len > 2);
                                    len && (output[_out++] = output[from++], len > 1 && (output[_out++] = output[from++]))
                                }
                                break
                            }
                        }
                        break
                    }
                } while (last > _in && end > _out);
                len = bits >> 3, _in -= len, bits -= len << 3, hold &= (1 << bits) - 1, strm.next_in = _in, strm.next_out = _out, strm.avail_in = last > _in ? 5 + (last - _in) : 5 - (_in - last), strm.avail_out = end > _out ? 257 + (end - _out) : 257 - (_out - end), state.hold = hold, state.bits = bits
            }
        }, {}],
        131: [function(require, module, exports) {
            "use strict";

            function zswap32(q) {
                return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((65280 & q) << 8) + ((255 & q) << 24)
            }

            function InflateState() {
                this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new utils.Buf16(320), this.work = new utils.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0
            }

            function inflateResetKeep(strm) {
                var state;
                return strm && strm.state ? (state = strm.state, strm.total_in = strm.total_out = state.total = 0, strm.msg = "", state.wrap && (strm.adler = 1 & state.wrap), state.mode = HEAD, state.last = 0, state.havedict = 0, state.dmax = 32768, state.head = null, state.hold = 0, state.bits = 0, state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS), state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS), state.sane = 1, state.back = -1, Z_OK) : Z_STREAM_ERROR
            }

            function inflateReset(strm) {
                var state;
                return strm && strm.state ? (state = strm.state, state.wsize = 0, state.whave = 0, state.wnext = 0, inflateResetKeep(strm)) : Z_STREAM_ERROR
            }

            function inflateReset2(strm, windowBits) {
                var wrap, state;
                return strm && strm.state ? (state = strm.state, 0 > windowBits ? (wrap = 0, windowBits = -windowBits) : (wrap = (windowBits >> 4) + 1, 48 > windowBits && (windowBits &= 15)), windowBits && (8 > windowBits || windowBits > 15) ? Z_STREAM_ERROR : (null !== state.window && state.wbits !== windowBits && (state.window = null), state.wrap = wrap, state.wbits = windowBits, inflateReset(strm))) : Z_STREAM_ERROR
            }

            function inflateInit2(strm, windowBits) {
                var ret, state;
                return strm ? (state = new InflateState, strm.state = state, state.window = null, ret = inflateReset2(strm, windowBits), ret !== Z_OK && (strm.state = null), ret) : Z_STREAM_ERROR
            }

            function inflateInit(strm) {
                return inflateInit2(strm, DEF_WBITS)
            }

            function fixedtables(state) {
                if (virgin) {
                    var sym;
                    for (lenfix = new utils.Buf32(512), distfix = new utils.Buf32(32), sym = 0; 144 > sym;) state.lens[sym++] = 8;
                    for (; 256 > sym;) state.lens[sym++] = 9;
                    for (; 280 > sym;) state.lens[sym++] = 7;
                    for (; 288 > sym;) state.lens[sym++] = 8;
                    for (inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, {
                            bits: 9
                        }), sym = 0; 32 > sym;) state.lens[sym++] = 5;
                    inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, {
                        bits: 5
                    }), virgin = !1
                }
                state.lencode = lenfix, state.lenbits = 9, state.distcode = distfix, state.distbits = 5
            }

            function updatewindow(strm, src, end, copy) {
                var dist, state = strm.state;
                return null === state.window && (state.wsize = 1 << state.wbits, state.wnext = 0, state.whave = 0, state.window = new utils.Buf8(state.wsize)), copy >= state.wsize ? (utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0), state.wnext = 0, state.whave = state.wsize) : (dist = state.wsize - state.wnext, dist > copy && (dist = copy), utils.arraySet(state.window, src, end - copy, dist, state.wnext), copy -= dist, copy ? (utils.arraySet(state.window, src, end - copy, copy, 0), state.wnext = copy, state.whave = state.wsize) : (state.wnext += dist, state.wnext === state.wsize && (state.wnext = 0), state.whave < state.wsize && (state.whave += dist))), 0
            }

            function inflate(strm, flush) {
                var state, input, output, next, put, have, left, hold, bits, _in, _out, copy, from, from_source, here_bits, here_op, here_val, last_bits, last_op, last_val, len, ret, opts, n, here = 0,
                    hbuf = new utils.Buf8(4),
                    order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
                if (!strm || !strm.state || !strm.output || !strm.input && 0 !== strm.avail_in) return Z_STREAM_ERROR;
                state = strm.state, state.mode === TYPE && (state.mode = TYPEDO), put = strm.next_out, output = strm.output, left = strm.avail_out, next = strm.next_in, input = strm.input, have = strm.avail_in, hold = state.hold, bits = state.bits, _in = have, _out = left, ret = Z_OK;
                inf_leave: for (;;) switch (state.mode) {
                    case HEAD:
                        if (0 === state.wrap) {
                            state.mode = TYPEDO;
                            break
                        }
                        for (; 16 > bits;) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        if (2 & state.wrap && 35615 === hold) {
                            state.check = 0, hbuf[0] = 255 & hold, hbuf[1] = hold >>> 8 & 255, state.check = crc32(state.check, hbuf, 2, 0), hold = 0, bits = 0, state.mode = FLAGS;
                            break
                        }
                        if (state.flags = 0, state.head && (state.head.done = !1), !(1 & state.wrap) || (((255 & hold) << 8) + (hold >> 8)) % 31) {
                            strm.msg = "incorrect header check", state.mode = BAD;
                            break
                        }
                        if ((15 & hold) !== Z_DEFLATED) {
                            strm.msg = "unknown compression method", state.mode = BAD;
                            break
                        }
                        if (hold >>>= 4, bits -= 4, len = (15 & hold) + 8, 0 === state.wbits) state.wbits = len;
                        else if (len > state.wbits) {
                            strm.msg = "invalid window size", state.mode = BAD;
                            break
                        }
                        state.dmax = 1 << len, strm.adler = state.check = 1, state.mode = 512 & hold ? DICTID : TYPE, hold = 0, bits = 0;
                        break;
                    case FLAGS:
                        for (; 16 > bits;) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        if (state.flags = hold, (255 & state.flags) !== Z_DEFLATED) {
                            strm.msg = "unknown compression method", state.mode = BAD;
                            break
                        }
                        if (57344 & state.flags) {
                            strm.msg = "unknown header flags set", state.mode = BAD;
                            break
                        }
                        state.head && (state.head.text = hold >> 8 & 1), 512 & state.flags && (hbuf[0] = 255 & hold, hbuf[1] = hold >>> 8 & 255, state.check = crc32(state.check, hbuf, 2, 0)), hold = 0, bits = 0, state.mode = TIME;
                    case TIME:
                        for (; 32 > bits;) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        state.head && (state.head.time = hold), 512 & state.flags && (hbuf[0] = 255 & hold, hbuf[1] = hold >>> 8 & 255, hbuf[2] = hold >>> 16 & 255, hbuf[3] = hold >>> 24 & 255, state.check = crc32(state.check, hbuf, 4, 0)), hold = 0, bits = 0, state.mode = OS;
                    case OS:
                        for (; 16 > bits;) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        state.head && (state.head.xflags = 255 & hold, state.head.os = hold >> 8), 512 & state.flags && (hbuf[0] = 255 & hold, hbuf[1] = hold >>> 8 & 255, state.check = crc32(state.check, hbuf, 2, 0)), hold = 0, bits = 0, state.mode = EXLEN;
                    case EXLEN:
                        if (1024 & state.flags) {
                            for (; 16 > bits;) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            state.length = hold, state.head && (state.head.extra_len = hold), 512 & state.flags && (hbuf[0] = 255 & hold, hbuf[1] = hold >>> 8 & 255, state.check = crc32(state.check, hbuf, 2, 0)), hold = 0, bits = 0
                        } else state.head && (state.head.extra = null);
                        state.mode = EXTRA;
                    case EXTRA:
                        if (1024 & state.flags && (copy = state.length, copy > have && (copy = have), copy && (state.head && (len = state.head.extra_len - state.length, state.head.extra || (state.head.extra = new Array(state.head.extra_len)), utils.arraySet(state.head.extra, input, next, copy, len)), 512 & state.flags && (state.check = crc32(state.check, input, copy, next)), have -= copy, next += copy, state.length -= copy), state.length)) break inf_leave;
                        state.length = 0, state.mode = NAME;
                    case NAME:
                        if (2048 & state.flags) {
                            if (0 === have) break inf_leave;
                            copy = 0;
                            do len = input[next + copy++], state.head && len && state.length < 65536 && (state.head.name += String.fromCharCode(len)); while (len && have > copy);
                            if (512 & state.flags && (state.check = crc32(state.check, input, copy, next)), have -= copy, next += copy, len) break inf_leave
                        } else state.head && (state.head.name = null);
                        state.length = 0, state.mode = COMMENT;
                    case COMMENT:
                        if (4096 & state.flags) {
                            if (0 === have) break inf_leave;
                            copy = 0;
                            do len = input[next + copy++], state.head && len && state.length < 65536 && (state.head.comment += String.fromCharCode(len)); while (len && have > copy);
                            if (512 & state.flags && (state.check = crc32(state.check, input, copy, next)), have -= copy, next += copy, len) break inf_leave
                        } else state.head && (state.head.comment = null);
                        state.mode = HCRC;
                    case HCRC:
                        if (512 & state.flags) {
                            for (; 16 > bits;) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            if (hold !== (65535 & state.check)) {
                                strm.msg = "header crc mismatch", state.mode = BAD;
                                break
                            }
                            hold = 0, bits = 0
                        }
                        state.head && (state.head.hcrc = state.flags >> 9 & 1, state.head.done = !0), strm.adler = state.check = 0, state.mode = TYPE;
                        break;
                    case DICTID:
                        for (; 32 > bits;) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        strm.adler = state.check = zswap32(hold), hold = 0, bits = 0, state.mode = DICT;
                    case DICT:
                        if (0 === state.havedict) return strm.next_out = put, strm.avail_out = left, strm.next_in = next, strm.avail_in = have, state.hold = hold, state.bits = bits, Z_NEED_DICT;
                        strm.adler = state.check = 1, state.mode = TYPE;
                    case TYPE:
                        if (flush === Z_BLOCK || flush === Z_TREES) break inf_leave;
                    case TYPEDO:
                        if (state.last) {
                            hold >>>= 7 & bits, bits -= 7 & bits, state.mode = CHECK;
                            break
                        }
                        for (; 3 > bits;) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        switch (state.last = 1 & hold, hold >>>= 1, bits -= 1, 3 & hold) {
                            case 0:
                                state.mode = STORED;
                                break;
                            case 1:
                                if (fixedtables(state), state.mode = LEN_, flush === Z_TREES) {
                                    hold >>>= 2, bits -= 2;
                                    break inf_leave
                                }
                                break;
                            case 2:
                                state.mode = TABLE;
                                break;
                            case 3:
                                strm.msg = "invalid block type", state.mode = BAD
                        }
                        hold >>>= 2, bits -= 2;
                        break;
                    case STORED:
                        for (hold >>>= 7 & bits, bits -= 7 & bits; 32 > bits;) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        if ((65535 & hold) !== (hold >>> 16 ^ 65535)) {
                            strm.msg = "invalid stored block lengths", state.mode = BAD;
                            break
                        }
                        if (state.length = 65535 & hold, hold = 0, bits = 0, state.mode = COPY_, flush === Z_TREES) break inf_leave;
                    case COPY_:
                        state.mode = COPY;
                    case COPY:
                        if (copy = state.length) {
                            if (copy > have && (copy = have), copy > left && (copy = left), 0 === copy) break inf_leave;
                            utils.arraySet(output, input, next, copy, put), have -= copy, next += copy, left -= copy, put += copy, state.length -= copy;
                            break
                        }
                        state.mode = TYPE;
                        break;
                    case TABLE:
                        for (; 14 > bits;) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        if (state.nlen = (31 & hold) + 257, hold >>>= 5, bits -= 5, state.ndist = (31 & hold) + 1, hold >>>= 5, bits -= 5, state.ncode = (15 & hold) + 4, hold >>>= 4, bits -= 4, state.nlen > 286 || state.ndist > 30) {
                            strm.msg = "too many length or distance symbols", state.mode = BAD;
                            break
                        }
                        state.have = 0, state.mode = LENLENS;
                    case LENLENS:
                        for (; state.have < state.ncode;) {
                            for (; 3 > bits;) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            state.lens[order[state.have++]] = 7 & hold, hold >>>= 3, bits -= 3
                        }
                        for (; state.have < 19;) state.lens[order[state.have++]] = 0;
                        if (state.lencode = state.lendyn, state.lenbits = 7, opts = {
                                bits: state.lenbits
                            }, ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts), state.lenbits = opts.bits, ret) {
                            strm.msg = "invalid code lengths set", state.mode = BAD;
                            break
                        }
                        state.have = 0, state.mode = CODELENS;
                    case CODELENS:
                        for (; state.have < state.nlen + state.ndist;) {
                            for (; here = state.lencode[hold & (1 << state.lenbits) - 1], here_bits = here >>> 24, here_op = here >>> 16 & 255, here_val = 65535 & here, !(bits >= here_bits);) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            if (16 > here_val) hold >>>= here_bits, bits -= here_bits, state.lens[state.have++] = here_val;
                            else {
                                if (16 === here_val) {
                                    for (n = here_bits + 2; n > bits;) {
                                        if (0 === have) break inf_leave;
                                        have--, hold += input[next++] << bits, bits += 8
                                    }
                                    if (hold >>>= here_bits, bits -= here_bits, 0 === state.have) {
                                        strm.msg = "invalid bit length repeat", state.mode = BAD;
                                        break
                                    }
                                    len = state.lens[state.have - 1], copy = 3 + (3 & hold), hold >>>= 2, bits -= 2
                                } else if (17 === here_val) {
                                    for (n = here_bits + 3; n > bits;) {
                                        if (0 === have) break inf_leave;
                                        have--, hold += input[next++] << bits, bits += 8
                                    }
                                    hold >>>= here_bits, bits -= here_bits, len = 0, copy = 3 + (7 & hold), hold >>>= 3, bits -= 3
                                } else {
                                    for (n = here_bits + 7; n > bits;) {
                                        if (0 === have) break inf_leave;
                                        have--, hold += input[next++] << bits, bits += 8
                                    }
                                    hold >>>= here_bits, bits -= here_bits, len = 0, copy = 11 + (127 & hold), hold >>>= 7, bits -= 7
                                }
                                if (state.have + copy > state.nlen + state.ndist) {
                                    strm.msg = "invalid bit length repeat", state.mode = BAD;
                                    break
                                }
                                for (; copy--;) state.lens[state.have++] = len
                            }
                        }
                        if (state.mode === BAD) break;
                        if (0 === state.lens[256]) {
                            strm.msg = "invalid code -- missing end-of-block", state.mode = BAD;
                            break
                        }
                        if (state.lenbits = 9, opts = {
                                bits: state.lenbits
                            }, ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts), state.lenbits = opts.bits, ret) {
                            strm.msg = "invalid literal/lengths set", state.mode = BAD;
                            break
                        }
                        if (state.distbits = 6, state.distcode = state.distdyn, opts = {
                                bits: state.distbits
                            }, ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts), state.distbits = opts.bits, ret) {
                            strm.msg = "invalid distances set", state.mode = BAD;
                            break
                        }
                        if (state.mode = LEN_, flush === Z_TREES) break inf_leave;
                    case LEN_:
                        state.mode = LEN;
                    case LEN:
                        if (have >= 6 && left >= 258) {
                            strm.next_out = put, strm.avail_out = left, strm.next_in = next, strm.avail_in = have, state.hold = hold, state.bits = bits, inflate_fast(strm, _out), put = strm.next_out, output = strm.output, left = strm.avail_out, next = strm.next_in, input = strm.input, have = strm.avail_in, hold = state.hold, bits = state.bits, state.mode === TYPE && (state.back = -1);
                            break
                        }
                        for (state.back = 0; here = state.lencode[hold & (1 << state.lenbits) - 1], here_bits = here >>> 24, here_op = here >>> 16 & 255, here_val = 65535 & here, !(bits >= here_bits);) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        if (here_op && 0 === (240 & here_op)) {
                            for (last_bits = here_bits, last_op = here_op, last_val = here_val; here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)], here_bits = here >>> 24, here_op = here >>> 16 & 255, here_val = 65535 & here, !(bits >= last_bits + here_bits);) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            hold >>>= last_bits, bits -= last_bits, state.back += last_bits
                        }
                        if (hold >>>= here_bits, bits -= here_bits, state.back += here_bits, state.length = here_val, 0 === here_op) {
                            state.mode = LIT;
                            break
                        }
                        if (32 & here_op) {
                            state.back = -1, state.mode = TYPE;
                            break
                        }
                        if (64 & here_op) {
                            strm.msg = "invalid literal/length code", state.mode = BAD;
                            break
                        }
                        state.extra = 15 & here_op, state.mode = LENEXT;
                    case LENEXT:
                        if (state.extra) {
                            for (n = state.extra; n > bits;) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            state.length += hold & (1 << state.extra) - 1, hold >>>= state.extra, bits -= state.extra, state.back += state.extra
                        }
                        state.was = state.length, state.mode = DIST;
                    case DIST:
                        for (; here = state.distcode[hold & (1 << state.distbits) - 1], here_bits = here >>> 24, here_op = here >>> 16 & 255, here_val = 65535 & here, !(bits >= here_bits);) {
                            if (0 === have) break inf_leave;
                            have--, hold += input[next++] << bits, bits += 8
                        }
                        if (0 === (240 & here_op)) {
                            for (last_bits = here_bits, last_op = here_op, last_val = here_val; here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)], here_bits = here >>> 24, here_op = here >>> 16 & 255, here_val = 65535 & here, !(bits >= last_bits + here_bits);) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            hold >>>= last_bits, bits -= last_bits, state.back += last_bits
                        }
                        if (hold >>>= here_bits, bits -= here_bits, state.back += here_bits, 64 & here_op) {
                            strm.msg = "invalid distance code", state.mode = BAD;
                            break
                        }
                        state.offset = here_val, state.extra = 15 & here_op, state.mode = DISTEXT;
                    case DISTEXT:
                        if (state.extra) {
                            for (n = state.extra; n > bits;) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            state.offset += hold & (1 << state.extra) - 1, hold >>>= state.extra, bits -= state.extra, state.back += state.extra
                        }
                        if (state.offset > state.dmax) {
                            strm.msg = "invalid distance too far back", state.mode = BAD;
                            break
                        }
                        state.mode = MATCH;
                    case MATCH:
                        if (0 === left) break inf_leave;
                        if (copy = _out - left, state.offset > copy) {
                            if (copy = state.offset - copy, copy > state.whave && state.sane) {
                                strm.msg = "invalid distance too far back", state.mode = BAD;
                                break
                            }
                            copy > state.wnext ? (copy -= state.wnext, from = state.wsize - copy) : from = state.wnext - copy, copy > state.length && (copy = state.length), from_source = state.window
                        } else from_source = output, from = put - state.offset, copy = state.length;
                        copy > left && (copy = left), left -= copy, state.length -= copy;
                        do output[put++] = from_source[from++]; while (--copy);
                        0 === state.length && (state.mode = LEN);
                        break;
                    case LIT:
                        if (0 === left) break inf_leave;
                        output[put++] = state.length, left--, state.mode = LEN;
                        break;
                    case CHECK:
                        if (state.wrap) {
                            for (; 32 > bits;) {
                                if (0 === have) break inf_leave;
                                have--, hold |= input[next++] << bits, bits += 8
                            }
                            if (_out -= left, strm.total_out += _out, state.total += _out, _out && (strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out)), _out = left, (state.flags ? hold : zswap32(hold)) !== state.check) {
                                strm.msg = "incorrect data check", state.mode = BAD;
                                break
                            }
                            hold = 0, bits = 0
                        }
                        state.mode = LENGTH;
                    case LENGTH:
                        if (state.wrap && state.flags) {
                            for (; 32 > bits;) {
                                if (0 === have) break inf_leave;
                                have--, hold += input[next++] << bits, bits += 8
                            }
                            if (hold !== (4294967295 & state.total)) {
                                strm.msg = "incorrect length check", state.mode = BAD;
                                break
                            }
                            hold = 0, bits = 0
                        }
                        state.mode = DONE;
                    case DONE:
                        ret = Z_STREAM_END;
                        break inf_leave;
                    case BAD:
                        ret = Z_DATA_ERROR;
                        break inf_leave;
                    case MEM:
                        return Z_MEM_ERROR;
                    case SYNC:
                    default:
                        return Z_STREAM_ERROR
                }
                return strm.next_out = put, strm.avail_out = left, strm.next_in = next, strm.avail_in = have, state.hold = hold, state.bits = bits, (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) && updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out) ? (state.mode = MEM, Z_MEM_ERROR) : (_in -= strm.avail_in, _out -= strm.avail_out, strm.total_in += _in, strm.total_out += _out, state.total += _out, state.wrap && _out && (strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out)),
                    strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0), (0 === _in && 0 === _out || flush === Z_FINISH) && ret === Z_OK && (ret = Z_BUF_ERROR), ret)
            }

            function inflateEnd(strm) {
                if (!strm || !strm.state) return Z_STREAM_ERROR;
                var state = strm.state;
                return state.window && (state.window = null), strm.state = null, Z_OK
            }

            function inflateGetHeader(strm, head) {
                var state;
                return strm && strm.state ? (state = strm.state, 0 === (2 & state.wrap) ? Z_STREAM_ERROR : (state.head = head, head.done = !1, Z_OK)) : Z_STREAM_ERROR
            }

            function inflateSetDictionary(strm, dictionary) {
                var state, dictid, ret, dictLength = dictionary.length;
                return strm && strm.state ? (state = strm.state, 0 !== state.wrap && state.mode !== DICT ? Z_STREAM_ERROR : state.mode === DICT && (dictid = 1, dictid = adler32(dictid, dictionary, dictLength, 0), dictid !== state.check) ? Z_DATA_ERROR : (ret = updatewindow(strm, dictionary, dictLength, dictLength)) ? (state.mode = MEM, Z_MEM_ERROR) : (state.havedict = 1, Z_OK)) : Z_STREAM_ERROR
            }
            var lenfix, distfix, utils = require("../utils/common"),
                adler32 = require("./adler32"),
                crc32 = require("./crc32"),
                inflate_fast = require("./inffast"),
                inflate_table = require("./inftrees"),
                CODES = 0,
                LENS = 1,
                DISTS = 2,
                Z_FINISH = 4,
                Z_BLOCK = 5,
                Z_TREES = 6,
                Z_OK = 0,
                Z_STREAM_END = 1,
                Z_NEED_DICT = 2,
                Z_STREAM_ERROR = -2,
                Z_DATA_ERROR = -3,
                Z_MEM_ERROR = -4,
                Z_BUF_ERROR = -5,
                Z_DEFLATED = 8,
                HEAD = 1,
                FLAGS = 2,
                TIME = 3,
                OS = 4,
                EXLEN = 5,
                EXTRA = 6,
                NAME = 7,
                COMMENT = 8,
                HCRC = 9,
                DICTID = 10,
                DICT = 11,
                TYPE = 12,
                TYPEDO = 13,
                STORED = 14,
                COPY_ = 15,
                COPY = 16,
                TABLE = 17,
                LENLENS = 18,
                CODELENS = 19,
                LEN_ = 20,
                LEN = 21,
                LENEXT = 22,
                DIST = 23,
                DISTEXT = 24,
                MATCH = 25,
                LIT = 26,
                CHECK = 27,
                LENGTH = 28,
                DONE = 29,
                BAD = 30,
                MEM = 31,
                SYNC = 32,
                ENOUGH_LENS = 852,
                ENOUGH_DISTS = 592,
                MAX_WBITS = 15,
                DEF_WBITS = MAX_WBITS,
                virgin = !0;
            exports.inflateReset = inflateReset, exports.inflateReset2 = inflateReset2, exports.inflateResetKeep = inflateResetKeep, exports.inflateInit = inflateInit, exports.inflateInit2 = inflateInit2, exports.inflate = inflate, exports.inflateEnd = inflateEnd, exports.inflateGetHeader = inflateGetHeader, exports.inflateSetDictionary = inflateSetDictionary, exports.inflateInfo = "pako inflate (from Nodeca project)"
        }, {
            "../utils/common": 123,
            "./adler32": 125,
            "./crc32": 127,
            "./inffast": 130,
            "./inftrees": 132
        }],
        132: [function(require, module, exports) {
            "use strict";
            var utils = require("../utils/common"),
                MAXBITS = 15,
                ENOUGH_LENS = 852,
                ENOUGH_DISTS = 592,
                CODES = 0,
                LENS = 1,
                DISTS = 2,
                lbase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0],
                lext = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78],
                dbase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0],
                dext = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
            module.exports = function(type, lens, lens_index, codes, table, table_index, work, opts) {
                var incr, fill, low, mask, next, end, here_bits, here_op, here_val, bits = opts.bits,
                    len = 0,
                    sym = 0,
                    min = 0,
                    max = 0,
                    root = 0,
                    curr = 0,
                    drop = 0,
                    left = 0,
                    used = 0,
                    huff = 0,
                    base = null,
                    base_index = 0,
                    count = new utils.Buf16(MAXBITS + 1),
                    offs = new utils.Buf16(MAXBITS + 1),
                    extra = null,
                    extra_index = 0;
                for (len = 0; MAXBITS >= len; len++) count[len] = 0;
                for (sym = 0; codes > sym; sym++) count[lens[lens_index + sym]]++;
                for (root = bits, max = MAXBITS; max >= 1 && 0 === count[max]; max--);
                if (root > max && (root = max), 0 === max) return table[table_index++] = 20971520, table[table_index++] = 20971520, opts.bits = 1, 0;
                for (min = 1; max > min && 0 === count[min]; min++);
                for (min > root && (root = min), left = 1, len = 1; MAXBITS >= len; len++)
                    if (left <<= 1, left -= count[len], 0 > left) return -1;
                if (left > 0 && (type === CODES || 1 !== max)) return -1;
                for (offs[1] = 0, len = 1; MAXBITS > len; len++) offs[len + 1] = offs[len] + count[len];
                for (sym = 0; codes > sym; sym++) 0 !== lens[lens_index + sym] && (work[offs[lens[lens_index + sym]]++] = sym);
                if (type === CODES ? (base = extra = work, end = 19) : type === LENS ? (base = lbase, base_index -= 257, extra = lext, extra_index -= 257, end = 256) : (base = dbase, extra = dext, end = -1), huff = 0, sym = 0, len = min, next = table_index, curr = root, drop = 0, low = -1, used = 1 << root, mask = used - 1, type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
                for (var i = 0;;) {
                    i++, here_bits = len - drop, work[sym] < end ? (here_op = 0, here_val = work[sym]) : work[sym] > end ? (here_op = extra[extra_index + work[sym]], here_val = base[base_index + work[sym]]) : (here_op = 96, here_val = 0), incr = 1 << len - drop, fill = 1 << curr, min = fill;
                    do fill -= incr, table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0; while (0 !== fill);
                    for (incr = 1 << len - 1; huff & incr;) incr >>= 1;
                    if (0 !== incr ? (huff &= incr - 1, huff += incr) : huff = 0, sym++, 0 === --count[len]) {
                        if (len === max) break;
                        len = lens[lens_index + work[sym]]
                    }
                    if (len > root && (huff & mask) !== low) {
                        for (0 === drop && (drop = root), next += min, curr = len - drop, left = 1 << curr; max > curr + drop && (left -= count[curr + drop], !(0 >= left));) curr++, left <<= 1;
                        if (used += 1 << curr, type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
                        low = huff & mask, table[low] = root << 24 | curr << 16 | next - table_index | 0
                    }
                }
                return 0 !== huff && (table[next + huff] = len - drop << 24 | 64 << 16 | 0), opts.bits = root, 0
            }
        }, {
            "../utils/common": 123
        }],
        133: [function(require, module, exports) {
            "use strict";
            module.exports = {
                2: "need dictionary",
                1: "stream end",
                0: "",
                "-1": "file error",
                "-2": "stream error",
                "-3": "data error",
                "-4": "insufficient memory",
                "-5": "buffer error",
                "-6": "incompatible version"
            }
        }, {}],
        134: [function(require, module, exports) {
            "use strict";

            function zero(buf) {
                for (var len = buf.length; --len >= 0;) buf[len] = 0
            }

            function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
                this.static_tree = static_tree, this.extra_bits = extra_bits, this.extra_base = extra_base, this.elems = elems, this.max_length = max_length, this.has_stree = static_tree && static_tree.length
            }

            function TreeDesc(dyn_tree, stat_desc) {
                this.dyn_tree = dyn_tree, this.max_code = 0, this.stat_desc = stat_desc
            }

            function d_code(dist) {
                return 256 > dist ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)]
            }

            function put_short(s, w) {
                s.pending_buf[s.pending++] = 255 & w, s.pending_buf[s.pending++] = w >>> 8 & 255
            }

            function send_bits(s, value, length) {
                s.bi_valid > Buf_size - length ? (s.bi_buf |= value << s.bi_valid & 65535, put_short(s, s.bi_buf), s.bi_buf = value >> Buf_size - s.bi_valid, s.bi_valid += length - Buf_size) : (s.bi_buf |= value << s.bi_valid & 65535, s.bi_valid += length)
            }

            function send_code(s, c, tree) {
                send_bits(s, tree[2 * c], tree[2 * c + 1])
            }

            function bi_reverse(code, len) {
                var res = 0;
                do res |= 1 & code, code >>>= 1, res <<= 1; while (--len > 0);
                return res >>> 1
            }

            function bi_flush(s) {
                16 === s.bi_valid ? (put_short(s, s.bi_buf), s.bi_buf = 0, s.bi_valid = 0) : s.bi_valid >= 8 && (s.pending_buf[s.pending++] = 255 & s.bi_buf, s.bi_buf >>= 8, s.bi_valid -= 8)
            }

            function gen_bitlen(s, desc) {
                var h, n, m, bits, xbits, f, tree = desc.dyn_tree,
                    max_code = desc.max_code,
                    stree = desc.stat_desc.static_tree,
                    has_stree = desc.stat_desc.has_stree,
                    extra = desc.stat_desc.extra_bits,
                    base = desc.stat_desc.extra_base,
                    max_length = desc.stat_desc.max_length,
                    overflow = 0;
                for (bits = 0; MAX_BITS >= bits; bits++) s.bl_count[bits] = 0;
                for (tree[2 * s.heap[s.heap_max] + 1] = 0, h = s.heap_max + 1; HEAP_SIZE > h; h++) n = s.heap[h], bits = tree[2 * tree[2 * n + 1] + 1] + 1, bits > max_length && (bits = max_length, overflow++), tree[2 * n + 1] = bits, n > max_code || (s.bl_count[bits]++, xbits = 0, n >= base && (xbits = extra[n - base]), f = tree[2 * n], s.opt_len += f * (bits + xbits), has_stree && (s.static_len += f * (stree[2 * n + 1] + xbits)));
                if (0 !== overflow) {
                    do {
                        for (bits = max_length - 1; 0 === s.bl_count[bits];) bits--;
                        s.bl_count[bits]--, s.bl_count[bits + 1] += 2, s.bl_count[max_length]--, overflow -= 2
                    } while (overflow > 0);
                    for (bits = max_length; 0 !== bits; bits--)
                        for (n = s.bl_count[bits]; 0 !== n;) m = s.heap[--h], m > max_code || (tree[2 * m + 1] !== bits && (s.opt_len += (bits - tree[2 * m + 1]) * tree[2 * m], tree[2 * m + 1] = bits), n--)
                }
            }

            function gen_codes(tree, max_code, bl_count) {
                var bits, n, next_code = new Array(MAX_BITS + 1),
                    code = 0;
                for (bits = 1; MAX_BITS >= bits; bits++) next_code[bits] = code = code + bl_count[bits - 1] << 1;
                for (n = 0; max_code >= n; n++) {
                    var len = tree[2 * n + 1];
                    0 !== len && (tree[2 * n] = bi_reverse(next_code[len]++, len))
                }
            }

            function tr_static_init() {
                var n, bits, length, code, dist, bl_count = new Array(MAX_BITS + 1);
                for (length = 0, code = 0; LENGTH_CODES - 1 > code; code++)
                    for (base_length[code] = length, n = 0; n < 1 << extra_lbits[code]; n++) _length_code[length++] = code;
                for (_length_code[length - 1] = code, dist = 0, code = 0; 16 > code; code++)
                    for (base_dist[code] = dist, n = 0; n < 1 << extra_dbits[code]; n++) _dist_code[dist++] = code;
                for (dist >>= 7; D_CODES > code; code++)
                    for (base_dist[code] = dist << 7, n = 0; n < 1 << extra_dbits[code] - 7; n++) _dist_code[256 + dist++] = code;
                for (bits = 0; MAX_BITS >= bits; bits++) bl_count[bits] = 0;
                for (n = 0; 143 >= n;) static_ltree[2 * n + 1] = 8, n++, bl_count[8]++;
                for (; 255 >= n;) static_ltree[2 * n + 1] = 9, n++, bl_count[9]++;
                for (; 279 >= n;) static_ltree[2 * n + 1] = 7, n++, bl_count[7]++;
                for (; 287 >= n;) static_ltree[2 * n + 1] = 8, n++, bl_count[8]++;
                for (gen_codes(static_ltree, L_CODES + 1, bl_count), n = 0; D_CODES > n; n++) static_dtree[2 * n + 1] = 5, static_dtree[2 * n] = bi_reverse(n, 5);
                static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS), static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS), static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS)
            }

            function init_block(s) {
                var n;
                for (n = 0; L_CODES > n; n++) s.dyn_ltree[2 * n] = 0;
                for (n = 0; D_CODES > n; n++) s.dyn_dtree[2 * n] = 0;
                for (n = 0; BL_CODES > n; n++) s.bl_tree[2 * n] = 0;
                s.dyn_ltree[2 * END_BLOCK] = 1, s.opt_len = s.static_len = 0, s.last_lit = s.matches = 0
            }

            function bi_windup(s) {
                s.bi_valid > 8 ? put_short(s, s.bi_buf) : s.bi_valid > 0 && (s.pending_buf[s.pending++] = s.bi_buf), s.bi_buf = 0, s.bi_valid = 0
            }

            function copy_block(s, buf, len, header) {
                bi_windup(s), header && (put_short(s, len), put_short(s, ~len)), utils.arraySet(s.pending_buf, s.window, buf, len, s.pending), s.pending += len
            }

            function smaller(tree, n, m, depth) {
                var _n2 = 2 * n,
                    _m2 = 2 * m;
                return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m]
            }

            function pqdownheap(s, tree, k) {
                for (var v = s.heap[k], j = k << 1; j <= s.heap_len && (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth) && j++, !smaller(tree, v, s.heap[j], s.depth));) s.heap[k] = s.heap[j], k = j, j <<= 1;
                s.heap[k] = v
            }

            function compress_block(s, ltree, dtree) {
                var dist, lc, code, extra, lx = 0;
                if (0 !== s.last_lit)
                    do dist = s.pending_buf[s.d_buf + 2 * lx] << 8 | s.pending_buf[s.d_buf + 2 * lx + 1], lc = s.pending_buf[s.l_buf + lx], lx++, 0 === dist ? send_code(s, lc, ltree) : (code = _length_code[lc], send_code(s, code + LITERALS + 1, ltree), extra = extra_lbits[code], 0 !== extra && (lc -= base_length[code], send_bits(s, lc, extra)), dist--, code = d_code(dist), send_code(s, code, dtree), extra = extra_dbits[code], 0 !== extra && (dist -= base_dist[code], send_bits(s, dist, extra))); while (lx < s.last_lit);
                send_code(s, END_BLOCK, ltree)
            }

            function build_tree(s, desc) {
                var n, m, node, tree = desc.dyn_tree,
                    stree = desc.stat_desc.static_tree,
                    has_stree = desc.stat_desc.has_stree,
                    elems = desc.stat_desc.elems,
                    max_code = -1;
                for (s.heap_len = 0, s.heap_max = HEAP_SIZE, n = 0; elems > n; n++) 0 !== tree[2 * n] ? (s.heap[++s.heap_len] = max_code = n, s.depth[n] = 0) : tree[2 * n + 1] = 0;
                for (; s.heap_len < 2;) node = s.heap[++s.heap_len] = 2 > max_code ? ++max_code : 0, tree[2 * node] = 1, s.depth[node] = 0, s.opt_len--, has_stree && (s.static_len -= stree[2 * node + 1]);
                for (desc.max_code = max_code, n = s.heap_len >> 1; n >= 1; n--) pqdownheap(s, tree, n);
                node = elems;
                do n = s.heap[1], s.heap[1] = s.heap[s.heap_len--], pqdownheap(s, tree, 1), m = s.heap[1], s.heap[--s.heap_max] = n, s.heap[--s.heap_max] = m, tree[2 * node] = tree[2 * n] + tree[2 * m], s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1, tree[2 * n + 1] = tree[2 * m + 1] = node, s.heap[1] = node++, pqdownheap(s, tree, 1); while (s.heap_len >= 2);
                s.heap[--s.heap_max] = s.heap[1], gen_bitlen(s, desc), gen_codes(tree, max_code, s.bl_count)
            }

            function scan_tree(s, tree, max_code) {
                var n, curlen, prevlen = -1,
                    nextlen = tree[1],
                    count = 0,
                    max_count = 7,
                    min_count = 4;
                for (0 === nextlen && (max_count = 138, min_count = 3), tree[2 * (max_code + 1) + 1] = 65535, n = 0; max_code >= n; n++) curlen = nextlen, nextlen = tree[2 * (n + 1) + 1], ++count < max_count && curlen === nextlen || (min_count > count ? s.bl_tree[2 * curlen] += count : 0 !== curlen ? (curlen !== prevlen && s.bl_tree[2 * curlen]++, s.bl_tree[2 * REP_3_6]++) : 10 >= count ? s.bl_tree[2 * REPZ_3_10]++ : s.bl_tree[2 * REPZ_11_138]++, count = 0, prevlen = curlen, 0 === nextlen ? (max_count = 138, min_count = 3) : curlen === nextlen ? (max_count = 6, min_count = 3) : (max_count = 7, min_count = 4))
            }

            function send_tree(s, tree, max_code) {
                var n, curlen, prevlen = -1,
                    nextlen = tree[1],
                    count = 0,
                    max_count = 7,
                    min_count = 4;
                for (0 === nextlen && (max_count = 138, min_count = 3), n = 0; max_code >= n; n++)
                    if (curlen = nextlen, nextlen = tree[2 * (n + 1) + 1], !(++count < max_count && curlen === nextlen)) {
                        if (min_count > count) {
                            do send_code(s, curlen, s.bl_tree); while (0 !== --count)
                        } else 0 !== curlen ? (curlen !== prevlen && (send_code(s, curlen, s.bl_tree), count--), send_code(s, REP_3_6, s.bl_tree), send_bits(s, count - 3, 2)) : 10 >= count ? (send_code(s, REPZ_3_10, s.bl_tree), send_bits(s, count - 3, 3)) : (send_code(s, REPZ_11_138, s.bl_tree), send_bits(s, count - 11, 7));
                        count = 0, prevlen = curlen, 0 === nextlen ? (max_count = 138, min_count = 3) : curlen === nextlen ? (max_count = 6, min_count = 3) : (max_count = 7, min_count = 4)
                    }
            }

            function build_bl_tree(s) {
                var max_blindex;
                for (scan_tree(s, s.dyn_ltree, s.l_desc.max_code), scan_tree(s, s.dyn_dtree, s.d_desc.max_code), build_tree(s, s.bl_desc), max_blindex = BL_CODES - 1; max_blindex >= 3 && 0 === s.bl_tree[2 * bl_order[max_blindex] + 1]; max_blindex--);
                return s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4, max_blindex
            }

            function send_all_trees(s, lcodes, dcodes, blcodes) {
                var rank;
                for (send_bits(s, lcodes - 257, 5), send_bits(s, dcodes - 1, 5), send_bits(s, blcodes - 4, 4), rank = 0; blcodes > rank; rank++) send_bits(s, s.bl_tree[2 * bl_order[rank] + 1], 3);
                send_tree(s, s.dyn_ltree, lcodes - 1), send_tree(s, s.dyn_dtree, dcodes - 1)
            }

            function detect_data_type(s) {
                var n, black_mask = 4093624447;
                for (n = 0; 31 >= n; n++, black_mask >>>= 1)
                    if (1 & black_mask && 0 !== s.dyn_ltree[2 * n]) return Z_BINARY;
                if (0 !== s.dyn_ltree[18] || 0 !== s.dyn_ltree[20] || 0 !== s.dyn_ltree[26]) return Z_TEXT;
                for (n = 32; LITERALS > n; n++)
                    if (0 !== s.dyn_ltree[2 * n]) return Z_TEXT;
                return Z_BINARY
            }

            function _tr_init(s) {
                static_init_done || (tr_static_init(), static_init_done = !0), s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc), s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc), s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc), s.bi_buf = 0, s.bi_valid = 0, init_block(s)
            }

            function _tr_stored_block(s, buf, stored_len, last) {
                send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3), copy_block(s, buf, stored_len, !0)
            }

            function _tr_align(s) {
                send_bits(s, STATIC_TREES << 1, 3), send_code(s, END_BLOCK, static_ltree), bi_flush(s)
            }

            function _tr_flush_block(s, buf, stored_len, last) {
                var opt_lenb, static_lenb, max_blindex = 0;
                s.level > 0 ? (s.strm.data_type === Z_UNKNOWN && (s.strm.data_type = detect_data_type(s)), build_tree(s, s.l_desc), build_tree(s, s.d_desc), max_blindex = build_bl_tree(s), opt_lenb = s.opt_len + 3 + 7 >>> 3, static_lenb = s.static_len + 3 + 7 >>> 3, opt_lenb >= static_lenb && (opt_lenb = static_lenb)) : opt_lenb = static_lenb = stored_len + 5, opt_lenb >= stored_len + 4 && -1 !== buf ? _tr_stored_block(s, buf, stored_len, last) : s.strategy === Z_FIXED || static_lenb === opt_lenb ? (send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3), compress_block(s, static_ltree, static_dtree)) : (send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3), send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1), compress_block(s, s.dyn_ltree, s.dyn_dtree)), init_block(s), last && bi_windup(s)
            }

            function _tr_tally(s, dist, lc) {
                return s.pending_buf[s.d_buf + 2 * s.last_lit] = dist >>> 8 & 255, s.pending_buf[s.d_buf + 2 * s.last_lit + 1] = 255 & dist, s.pending_buf[s.l_buf + s.last_lit] = 255 & lc, s.last_lit++, 0 === dist ? s.dyn_ltree[2 * lc]++ : (s.matches++, dist--, s.dyn_ltree[2 * (_length_code[lc] + LITERALS + 1)]++, s.dyn_dtree[2 * d_code(dist)]++), s.last_lit === s.lit_bufsize - 1
            }
            var utils = require("../utils/common"),
                Z_FIXED = 4,
                Z_BINARY = 0,
                Z_TEXT = 1,
                Z_UNKNOWN = 2,
                STORED_BLOCK = 0,
                STATIC_TREES = 1,
                DYN_TREES = 2,
                MIN_MATCH = 3,
                MAX_MATCH = 258,
                LENGTH_CODES = 29,
                LITERALS = 256,
                L_CODES = LITERALS + 1 + LENGTH_CODES,
                D_CODES = 30,
                BL_CODES = 19,
                HEAP_SIZE = 2 * L_CODES + 1,
                MAX_BITS = 15,
                Buf_size = 16,
                MAX_BL_BITS = 7,
                END_BLOCK = 256,
                REP_3_6 = 16,
                REPZ_3_10 = 17,
                REPZ_11_138 = 18,
                extra_lbits = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0],
                extra_dbits = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
                extra_blbits = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7],
                bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
                DIST_CODE_LEN = 512,
                static_ltree = new Array(2 * (L_CODES + 2));
            zero(static_ltree);
            var static_dtree = new Array(2 * D_CODES);
            zero(static_dtree);
            var _dist_code = new Array(DIST_CODE_LEN);
            zero(_dist_code);
            var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
            zero(_length_code);
            var base_length = new Array(LENGTH_CODES);
            zero(base_length);
            var base_dist = new Array(D_CODES);
            zero(base_dist);
            var static_l_desc, static_d_desc, static_bl_desc, static_init_done = !1;
            exports._tr_init = _tr_init, exports._tr_stored_block = _tr_stored_block, exports._tr_flush_block = _tr_flush_block, exports._tr_tally = _tr_tally, exports._tr_align = _tr_align
        }, {
            "../utils/common": 123
        }],
        135: [function(require, module, exports) {
            "use strict";

            function ZStream() {
                this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0
            }
            module.exports = ZStream
        }, {}],
        136: [function(require, module, exports) {
            (function(process) {
                function normalizeArray(parts, allowAboveRoot) {
                    for (var up = 0, i = parts.length - 1; i >= 0; i--) {
                        var last = parts[i];
                        "." === last ? parts.splice(i, 1) : ".." === last ? (parts.splice(i, 1), up++) : up && (parts.splice(i, 1), up--)
                    }
                    if (allowAboveRoot)
                        for (; up--; up) parts.unshift("..");
                    return parts
                }

                function filter(xs, f) {
                    if (xs.filter) return xs.filter(f);
                    for (var res = [], i = 0; i < xs.length; i++) f(xs[i], i, xs) && res.push(xs[i]);
                    return res
                }
                var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/,
                    splitPath = function(filename) {
                        return splitPathRe.exec(filename).slice(1)
                    };
                exports.resolve = function() {
                    for (var resolvedPath = "", resolvedAbsolute = !1, i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                        var path = i >= 0 ? arguments[i] : process.cwd();
                        if ("string" != typeof path) throw new TypeError("Arguments to path.resolve must be strings");
                        path && (resolvedPath = path + "/" + resolvedPath, resolvedAbsolute = "/" === path.charAt(0))
                    }
                    return resolvedPath = normalizeArray(filter(resolvedPath.split("/"), function(p) {
                        return !!p
                    }), !resolvedAbsolute).join("/"), (resolvedAbsolute ? "/" : "") + resolvedPath || "."
                }, exports.normalize = function(path) {
                    var isAbsolute = exports.isAbsolute(path),
                        trailingSlash = "/" === substr(path, -1);
                    return path = normalizeArray(filter(path.split("/"), function(p) {
                        return !!p
                    }), !isAbsolute).join("/"), path || isAbsolute || (path = "."), path && trailingSlash && (path += "/"), (isAbsolute ? "/" : "") + path
                }, exports.isAbsolute = function(path) {
                    return "/" === path.charAt(0)
                }, exports.join = function() {
                    var paths = Array.prototype.slice.call(arguments, 0);
                    return exports.normalize(filter(paths, function(p, index) {
                        if ("string" != typeof p) throw new TypeError("Arguments to path.join must be strings");
                        return p
                    }).join("/"))
                }, exports.relative = function(from, to) {
                    function trim(arr) {
                        for (var start = 0; start < arr.length && "" === arr[start]; start++);
                        for (var end = arr.length - 1; end >= 0 && "" === arr[end]; end--);
                        return start > end ? [] : arr.slice(start, end - start + 1)
                    }
                    from = exports.resolve(from).substr(1), to = exports.resolve(to).substr(1);
                    for (var fromParts = trim(from.split("/")), toParts = trim(to.split("/")), length = Math.min(fromParts.length, toParts.length), samePartsLength = length, i = 0; length > i; i++)
                        if (fromParts[i] !== toParts[i]) {
                            samePartsLength = i;
                            break
                        } for (var outputParts = [], i = samePartsLength; i < fromParts.length; i++) outputParts.push("..");
                    return outputParts = outputParts.concat(toParts.slice(samePartsLength)), outputParts.join("/")
                }, exports.sep = "/", exports.delimiter = ":", exports.dirname = function(path) {
                    var result = splitPath(path),
                        root = result[0],
                        dir = result[1];
                    return root || dir ? (dir && (dir = dir.substr(0, dir.length - 1)), root + dir) : "."
                }, exports.basename = function(path, ext) {
                    var f = splitPath(path)[2];
                    return ext && f.substr(-1 * ext.length) === ext && (f = f.substr(0, f.length - ext.length)), f
                }, exports.extname = function(path) {
                    return splitPath(path)[3]
                };
                var substr = "b" === "ab".substr(-1) ? function(str, start, len) {
                    return str.substr(start, len)
                } : function(str, start, len) {
                    return 0 > start && (start = str.length + start), str.substr(start, len)
                }
            }).call(this, require("_process"))
        }, {
            _process: 138
        }],
        137: [function(require, module, exports) {
            (function(process) {
                "use strict";

                function nextTick(fn, arg1, arg2, arg3) {
                    if ("function" != typeof fn) throw new TypeError('"callback" argument must be a function');
                    var args, i, len = arguments.length;
                    switch (len) {
                        case 0:
                        case 1:
                            return process.nextTick(fn);
                        case 2:
                            return process.nextTick(function() {
                                fn.call(null, arg1)
                            });
                        case 3:
                            return process.nextTick(function() {
                                fn.call(null, arg1, arg2)
                            });
                        case 4:
                            return process.nextTick(function() {
                                fn.call(null, arg1, arg2, arg3)
                            });
                        default:
                            for (args = new Array(len - 1), i = 0; i < args.length;) args[i++] = arguments[i];
                            return process.nextTick(function() {
                                fn.apply(null, args)
                            })
                    }
                }!process.version || 0 === process.version.indexOf("v0.") || 0 === process.version.indexOf("v1.") && 0 !== process.version.indexOf("v1.8.") ? module.exports = nextTick : module.exports = process.nextTick
            }).call(this, require("_process"))
        }, {
            _process: 138
        }],
        138: [function(require, module, exports) {
            function defaultSetTimout() {
                throw new Error("setTimeout has not been defined")
            }

            function defaultClearTimeout() {
                throw new Error("clearTimeout has not been defined")
            }

            function runTimeout(fun) {
                if (cachedSetTimeout === setTimeout) return setTimeout(fun, 0);
                if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) return cachedSetTimeout = setTimeout, setTimeout(fun, 0);
                try {
                    return cachedSetTimeout(fun, 0)
                } catch (e) {
                    try {
                        return cachedSetTimeout.call(null, fun, 0)
                    } catch (e) {
                        return cachedSetTimeout.call(this, fun, 0)
                    }
                }
            }

            function runClearTimeout(marker) {
                if (cachedClearTimeout === clearTimeout) return clearTimeout(marker);
                if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) return cachedClearTimeout = clearTimeout, clearTimeout(marker);
                try {
                    return cachedClearTimeout(marker)
                } catch (e) {
                    try {
                        return cachedClearTimeout.call(null, marker)
                    } catch (e) {
                        return cachedClearTimeout.call(this, marker)
                    }
                }
            }

            function cleanUpNextTick() {
                draining && currentQueue && (draining = !1, currentQueue.length ? queue = currentQueue.concat(queue) : queueIndex = -1, queue.length && drainQueue())
            }

            function drainQueue() {
                if (!draining) {
                    var timeout = runTimeout(cleanUpNextTick);
                    draining = !0;
                    for (var len = queue.length; len;) {
                        for (currentQueue = queue, queue = []; ++queueIndex < len;) currentQueue && currentQueue[queueIndex].run();
                        queueIndex = -1, len = queue.length
                    }
                    currentQueue = null, draining = !1, runClearTimeout(timeout)
                }
            }

            function Item(fun, array) {
                this.fun = fun, this.array = array
            }

            function noop() {}
            var cachedSetTimeout, cachedClearTimeout, process = module.exports = {};
            ! function() {
                try {
                    cachedSetTimeout = "function" == typeof setTimeout ? setTimeout : defaultSetTimout
                } catch (e) {
                    cachedSetTimeout = defaultSetTimout
                }
                try {
                    cachedClearTimeout = "function" == typeof clearTimeout ? clearTimeout : defaultClearTimeout
                } catch (e) {
                    cachedClearTimeout = defaultClearTimeout
                }
            }();
            var currentQueue, queue = [],
                draining = !1,
                queueIndex = -1;
            process.nextTick = function(fun) {
                var args = new Array(arguments.length - 1);
                if (arguments.length > 1)
                    for (var i = 1; i < arguments.length; i++) args[i - 1] = arguments[i];
                queue.push(new Item(fun, args)), 1 !== queue.length || draining || runTimeout(drainQueue)
            }, Item.prototype.run = function() {
                this.fun.apply(null, this.array)
            }, process.title = "browser", process.browser = !0, process.env = {}, process.argv = [], process.version = "", process.versions = {}, process.on = noop, process.addListener = noop, process.once = noop, process.off = noop, process.removeListener = noop, process.removeAllListeners = noop, process.emit = noop, process.binding = function(name) {
                throw new Error("process.binding is not supported")
            }, process.cwd = function() {
                return "/"
            }, process.chdir = function(dir) {
                throw new Error("process.chdir is not supported")
            }, process.umask = function() {
                return 0
            }
        }, {}],
        139: [function(require, module, exports) {
            module.exports = require("./lib/_stream_duplex.js")
        }, {
            "./lib/_stream_duplex.js": 140
        }],
        140: [function(require, module, exports) {
            "use strict";

            function Duplex(options) {
                return this instanceof Duplex ? (Readable.call(this, options), Writable.call(this, options), options && options.readable === !1 && (this.readable = !1), options && options.writable === !1 && (this.writable = !1), this.allowHalfOpen = !0, options && options.allowHalfOpen === !1 && (this.allowHalfOpen = !1), void this.once("end", onend)) : new Duplex(options)
            }

            function onend() {
                this.allowHalfOpen || this._writableState.ended || processNextTick(onEndNT, this)
            }

            function onEndNT(self) {
                self.end()
            }
            var objectKeys = Object.keys || function(obj) {
                var keys = [];
                for (var key in obj) keys.push(key);
                return keys
            };
            module.exports = Duplex;
            var processNextTick = require("process-nextick-args"),
                util = require("core-util-is");
            util.inherits = require("inherits");
            var Readable = require("./_stream_readable"),
                Writable = require("./_stream_writable");
            util.inherits(Duplex, Readable);
            for (var keys = objectKeys(Writable.prototype), v = 0; v < keys.length; v++) {
                var method = keys[v];
                Duplex.prototype[method] || (Duplex.prototype[method] = Writable.prototype[method])
            }
        }, {
            "./_stream_readable": 142,
            "./_stream_writable": 144,
            "core-util-is": 78,
            inherits: 81,
            "process-nextick-args": 137
        }],
        141: [function(require, module, exports) {
            "use strict";

            function PassThrough(options) {
                return this instanceof PassThrough ? void Transform.call(this, options) : new PassThrough(options)
            }
            module.exports = PassThrough;
            var Transform = require("./_stream_transform"),
                util = require("core-util-is");
            util.inherits = require("inherits"), util.inherits(PassThrough, Transform), PassThrough.prototype._transform = function(chunk, encoding, cb) {
                cb(null, chunk)
            }
        }, {
            "./_stream_transform": 143,
            "core-util-is": 78,
            inherits: 81
        }],
        142: [function(require, module, exports) {
            (function(process) {
                "use strict";

                function prependListener(emitter, event, fn) {
                    return "function" == typeof emitter.prependListener ? emitter.prependListener(event, fn) : void(emitter._events && emitter._events[event] ? isArray(emitter._events[event]) ? emitter._events[event].unshift(fn) : emitter._events[event] = [fn, emitter._events[event]] : emitter.on(event, fn))
                }

                function ReadableState(options, stream) {
                    Duplex = Duplex || require("./_stream_duplex"), options = options || {}, this.objectMode = !!options.objectMode, stream instanceof Duplex && (this.objectMode = this.objectMode || !!options.readableObjectMode);
                    var hwm = options.highWaterMark,
                        defaultHwm = this.objectMode ? 16 : 16384;
                    this.highWaterMark = hwm || 0 === hwm ? hwm : defaultHwm, this.highWaterMark = ~~this.highWaterMark, this.buffer = new BufferList, this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.defaultEncoding = options.defaultEncoding || "utf8", this.ranOut = !1, this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, options.encoding && (StringDecoder || (StringDecoder = require("string_decoder/").StringDecoder), this.decoder = new StringDecoder(options.encoding), this.encoding = options.encoding)
                }

                function Readable(options) {
                    return Duplex = Duplex || require("./_stream_duplex"), this instanceof Readable ? (this._readableState = new ReadableState(options, this), this.readable = !0, options && "function" == typeof options.read && (this._read = options.read), void Stream.call(this)) : new Readable(options)
                }

                function readableAddChunk(stream, state, chunk, encoding, addToFront) {
                    var er = chunkInvalid(state, chunk);
                    if (er) stream.emit("error", er);
                    else if (null === chunk) state.reading = !1, onEofChunk(stream, state);
                    else if (state.objectMode || chunk && chunk.length > 0)
                        if (state.ended && !addToFront) {
                            var e = new Error("stream.push() after EOF");
                            stream.emit("error", e)
                        } else if (state.endEmitted && addToFront) {
                        var _e = new Error("stream.unshift() after end event");
                        stream.emit("error", _e)
                    } else {
                        var skipAdd;
                        !state.decoder || addToFront || encoding || (chunk = state.decoder.write(chunk), skipAdd = !state.objectMode && 0 === chunk.length), addToFront || (state.reading = !1), skipAdd || (state.flowing && 0 === state.length && !state.sync ? (stream.emit("data", chunk), stream.read(0)) : (state.length += state.objectMode ? 1 : chunk.length, addToFront ? state.buffer.unshift(chunk) : state.buffer.push(chunk), state.needReadable && emitReadable(stream))), maybeReadMore(stream, state)
                    } else addToFront || (state.reading = !1);
                    return needMoreData(state)
                }

                function needMoreData(state) {
                    return !state.ended && (state.needReadable || state.length < state.highWaterMark || 0 === state.length)
                }

                function computeNewHighWaterMark(n) {
                    return n >= MAX_HWM ? n = MAX_HWM : (n--, n |= n >>> 1, n |= n >>> 2, n |= n >>> 4, n |= n >>> 8, n |= n >>> 16, n++), n
                }

                function howMuchToRead(n, state) {
                    return 0 >= n || 0 === state.length && state.ended ? 0 : state.objectMode ? 1 : n !== n ? state.flowing && state.length ? state.buffer.head.data.length : state.length : (n > state.highWaterMark && (state.highWaterMark = computeNewHighWaterMark(n)), n <= state.length ? n : state.ended ? state.length : (state.needReadable = !0, 0))
                }

                function chunkInvalid(state, chunk) {
                    var er = null;
                    return Buffer.isBuffer(chunk) || "string" == typeof chunk || null === chunk || void 0 === chunk || state.objectMode || (er = new TypeError("Invalid non-string/buffer chunk")), er
                }

                function onEofChunk(stream, state) {
                    if (!state.ended) {
                        if (state.decoder) {
                            var chunk = state.decoder.end();
                            chunk && chunk.length && (state.buffer.push(chunk), state.length += state.objectMode ? 1 : chunk.length)
                        }
                        state.ended = !0, emitReadable(stream)
                    }
                }

                function emitReadable(stream) {
                    var state = stream._readableState;
                    state.needReadable = !1, state.emittedReadable || (debug("emitReadable", state.flowing), state.emittedReadable = !0, state.sync ? processNextTick(emitReadable_, stream) : emitReadable_(stream))
                }

                function emitReadable_(stream) {
                    debug("emit readable"), stream.emit("readable"), flow(stream)
                }

                function maybeReadMore(stream, state) {
                    state.readingMore || (state.readingMore = !0, processNextTick(maybeReadMore_, stream, state))
                }

                function maybeReadMore_(stream, state) {
                    for (var len = state.length; !state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark && (debug("maybeReadMore read 0"), stream.read(0), len !== state.length);) len = state.length;
                    state.readingMore = !1
                }

                function pipeOnDrain(src) {
                    return function() {
                        var state = src._readableState;
                        debug("pipeOnDrain", state.awaitDrain), state.awaitDrain && state.awaitDrain--, 0 === state.awaitDrain && EElistenerCount(src, "data") && (state.flowing = !0, flow(src))
                    }
                }

                function nReadingNextTick(self) {
                    debug("readable nexttick read 0"), self.read(0)
                }

                function resume(stream, state) {
                    state.resumeScheduled || (state.resumeScheduled = !0, processNextTick(resume_, stream, state))
                }

                function resume_(stream, state) {
                    state.reading || (debug("resume read 0"), stream.read(0)), state.resumeScheduled = !1, state.awaitDrain = 0, stream.emit("resume"), flow(stream), state.flowing && !state.reading && stream.read(0)
                }

                function flow(stream) {
                    var state = stream._readableState;
                    for (debug("flow", state.flowing); state.flowing && null !== stream.read(););
                }

                function fromList(n, state) {
                    if (0 === state.length) return null;
                    var ret;
                    return state.objectMode ? ret = state.buffer.shift() : !n || n >= state.length ? (ret = state.decoder ? state.buffer.join("") : 1 === state.buffer.length ? state.buffer.head.data : state.buffer.concat(state.length), state.buffer.clear()) : ret = fromListPartial(n, state.buffer, state.decoder), ret
                }

                function fromListPartial(n, list, hasStrings) {
                    var ret;
                    return n < list.head.data.length ? (ret = list.head.data.slice(0, n), list.head.data = list.head.data.slice(n)) : ret = n === list.head.data.length ? list.shift() : hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list), ret
                }

                function copyFromBufferString(n, list) {
                    var p = list.head,
                        c = 1,
                        ret = p.data;
                    for (n -= ret.length; p = p.next;) {
                        var str = p.data,
                            nb = n > str.length ? str.length : n;
                        if (ret += nb === str.length ? str : str.slice(0, n), n -= nb, 0 === n) {
                            nb === str.length ? (++c, p.next ? list.head = p.next : list.head = list.tail = null) : (list.head = p, p.data = str.slice(nb));
                            break
                        }++c
                    }
                    return list.length -= c, ret
                }

                function copyFromBuffer(n, list) {
                    var ret = bufferShim.allocUnsafe(n),
                        p = list.head,
                        c = 1;
                    for (p.data.copy(ret), n -= p.data.length; p = p.next;) {
                        var buf = p.data,
                            nb = n > buf.length ? buf.length : n;
                        if (buf.copy(ret, ret.length - n, 0, nb), n -= nb, 0 === n) {
                            nb === buf.length ? (++c, p.next ? list.head = p.next : list.head = list.tail = null) : (list.head = p, p.data = buf.slice(nb));
                            break
                        }++c
                    }
                    return list.length -= c, ret
                }

                function endReadable(stream) {
                    var state = stream._readableState;
                    if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
                    state.endEmitted || (state.ended = !0, processNextTick(endReadableNT, state, stream))
                }

                function endReadableNT(state, stream) {
                    state.endEmitted || 0 !== state.length || (state.endEmitted = !0, stream.readable = !1, stream.emit("end"))
                }

                function forEach(xs, f) {
                    for (var i = 0, l = xs.length; l > i; i++) f(xs[i], i)
                }

                function indexOf(xs, x) {
                    for (var i = 0, l = xs.length; l > i; i++)
                        if (xs[i] === x) return i;
                    return -1
                }
                module.exports = Readable;
                var Duplex, processNextTick = require("process-nextick-args"),
                    isArray = require("isarray");
                Readable.ReadableState = ReadableState;
                var Stream, EElistenerCount = (require("events").EventEmitter, function(emitter, type) {
                    return emitter.listeners(type).length
                });
                ! function() {
                    try {
                        Stream = require("stream")
                    } catch (_) {} finally {
                        Stream || (Stream = require("events").EventEmitter)
                    }
                }();
                var Buffer = require("buffer").Buffer,
                    bufferShim = require("buffer-shims"),
                    util = require("core-util-is");
                util.inherits = require("inherits");
                var debugUtil = require("util"),
                    debug = void 0;
                debug = debugUtil && debugUtil.debuglog ? debugUtil.debuglog("stream") : function() {};
                var StringDecoder, BufferList = require("./internal/streams/BufferList");
                util.inherits(Readable, Stream), Readable.prototype.push = function(chunk, encoding) {
                    var state = this._readableState;
                    return state.objectMode || "string" != typeof chunk || (encoding = encoding || state.defaultEncoding, encoding !== state.encoding && (chunk = bufferShim.from(chunk, encoding), encoding = "")), readableAddChunk(this, state, chunk, encoding, !1)
                }, Readable.prototype.unshift = function(chunk) {
                    var state = this._readableState;
                    return readableAddChunk(this, state, chunk, "", !0)
                }, Readable.prototype.isPaused = function() {
                    return this._readableState.flowing === !1
                }, Readable.prototype.setEncoding = function(enc) {
                    return StringDecoder || (StringDecoder = require("string_decoder/").StringDecoder), this._readableState.decoder = new StringDecoder(enc), this._readableState.encoding = enc, this
                };
                var MAX_HWM = 8388608;
                Readable.prototype.read = function(n) {
                    debug("read", n), n = parseInt(n, 10);
                    var state = this._readableState,
                        nOrig = n;
                    if (0 !== n && (state.emittedReadable = !1), 0 === n && state.needReadable && (state.length >= state.highWaterMark || state.ended)) return debug("read: emitReadable", state.length, state.ended), 0 === state.length && state.ended ? endReadable(this) : emitReadable(this), null;
                    if (n = howMuchToRead(n, state), 0 === n && state.ended) return 0 === state.length && endReadable(this), null;
                    var doRead = state.needReadable;
                    debug("need readable", doRead), (0 === state.length || state.length - n < state.highWaterMark) && (doRead = !0, debug("length less than watermark", doRead)), state.ended || state.reading ? (doRead = !1, debug("reading or ended", doRead)) : doRead && (debug("do read"), state.reading = !0, state.sync = !0, 0 === state.length && (state.needReadable = !0), this._read(state.highWaterMark), state.sync = !1, state.reading || (n = howMuchToRead(nOrig, state)));
                    var ret;
                    return ret = n > 0 ? fromList(n, state) : null, null === ret ? (state.needReadable = !0, n = 0) : state.length -= n, 0 === state.length && (state.ended || (state.needReadable = !0), nOrig !== n && state.ended && endReadable(this)), null !== ret && this.emit("data", ret), ret
                }, Readable.prototype._read = function(n) {
                    this.emit("error", new Error("_read() is not implemented"))
                }, Readable.prototype.pipe = function(dest, pipeOpts) {
                    function onunpipe(readable) {
                        debug("onunpipe"), readable === src && cleanup()
                    }

                    function onend() {
                        debug("onend"), dest.end()
                    }

                    function cleanup() {
                        debug("cleanup"), dest.removeListener("close", onclose), dest.removeListener("finish", onfinish), dest.removeListener("drain", ondrain), dest.removeListener("error", onerror), dest.removeListener("unpipe", onunpipe), src.removeListener("end", onend), src.removeListener("end", cleanup), src.removeListener("data", ondata), cleanedUp = !0, !state.awaitDrain || dest._writableState && !dest._writableState.needDrain || ondrain()
                    }

                    function ondata(chunk) {
                        debug("ondata"), increasedAwaitDrain = !1;
                        var ret = dest.write(chunk);
                        !1 !== ret || increasedAwaitDrain || ((1 === state.pipesCount && state.pipes === dest || state.pipesCount > 1 && -1 !== indexOf(state.pipes, dest)) && !cleanedUp && (debug("false write response, pause", src._readableState.awaitDrain), src._readableState.awaitDrain++, increasedAwaitDrain = !0), src.pause())
                    }

                    function onerror(er) {
                        debug("onerror", er), unpipe(), dest.removeListener("error", onerror), 0 === EElistenerCount(dest, "error") && dest.emit("error", er)
                    }

                    function onclose() {
                        dest.removeListener("finish", onfinish), unpipe()
                    }

                    function onfinish() {
                        debug("onfinish"), dest.removeListener("close", onclose), unpipe()
                    }

                    function unpipe() {
                        debug("unpipe"), src.unpipe(dest)
                    }
                    var src = this,
                        state = this._readableState;
                    switch (state.pipesCount) {
                        case 0:
                            state.pipes = dest;
                            break;
                        case 1:
                            state.pipes = [state.pipes, dest];
                            break;
                        default:
                            state.pipes.push(dest)
                    }
                    state.pipesCount += 1, debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
                    var doEnd = (!pipeOpts || pipeOpts.end !== !1) && dest !== process.stdout && dest !== process.stderr,
                        endFn = doEnd ? onend : cleanup;
                    state.endEmitted ? processNextTick(endFn) : src.once("end", endFn), dest.on("unpipe", onunpipe);
                    var ondrain = pipeOnDrain(src);
                    dest.on("drain", ondrain);
                    var cleanedUp = !1,
                        increasedAwaitDrain = !1;
                    return src.on("data", ondata), prependListener(dest, "error", onerror), dest.once("close", onclose), dest.once("finish", onfinish), dest.emit("pipe", src), state.flowing || (debug("pipe resume"), src.resume()), dest
                }, Readable.prototype.unpipe = function(dest) {
                    var state = this._readableState;
                    if (0 === state.pipesCount) return this;
                    if (1 === state.pipesCount) return dest && dest !== state.pipes ? this : (dest || (dest = state.pipes), state.pipes = null, state.pipesCount = 0, state.flowing = !1, dest && dest.emit("unpipe", this), this);
                    if (!dest) {
                        var dests = state.pipes,
                            len = state.pipesCount;
                        state.pipes = null, state.pipesCount = 0, state.flowing = !1;
                        for (var i = 0; len > i; i++) dests[i].emit("unpipe", this);
                        return this
                    }
                    var index = indexOf(state.pipes, dest);
                    return -1 === index ? this : (state.pipes.splice(index, 1), state.pipesCount -= 1, 1 === state.pipesCount && (state.pipes = state.pipes[0]), dest.emit("unpipe", this), this)
                }, Readable.prototype.on = function(ev, fn) {
                    var res = Stream.prototype.on.call(this, ev, fn);
                    if ("data" === ev) this._readableState.flowing !== !1 && this.resume();
                    else if ("readable" === ev) {
                        var state = this._readableState;
                        state.endEmitted || state.readableListening || (state.readableListening = state.needReadable = !0, state.emittedReadable = !1, state.reading ? state.length && emitReadable(this, state) : processNextTick(nReadingNextTick, this))
                    }
                    return res
                }, Readable.prototype.addListener = Readable.prototype.on, Readable.prototype.resume = function() {
                    var state = this._readableState;
                    return state.flowing || (debug("resume"), state.flowing = !0, resume(this, state)), this
                }, Readable.prototype.pause = function() {
                    return debug("call pause flowing=%j", this._readableState.flowing), !1 !== this._readableState.flowing && (debug("pause"), this._readableState.flowing = !1, this.emit("pause")), this
                }, Readable.prototype.wrap = function(stream) {
                    var state = this._readableState,
                        paused = !1,
                        self = this;
                    stream.on("end", function() {
                        if (debug("wrapped end"), state.decoder && !state.ended) {
                            var chunk = state.decoder.end();
                            chunk && chunk.length && self.push(chunk)
                        }
                        self.push(null)
                    }), stream.on("data", function(chunk) {
                        if (debug("wrapped data"), state.decoder && (chunk = state.decoder.write(chunk)), (!state.objectMode || null !== chunk && void 0 !== chunk) && (state.objectMode || chunk && chunk.length)) {
                            var ret = self.push(chunk);
                            ret || (paused = !0, stream.pause())
                        }
                    });
                    for (var i in stream) void 0 === this[i] && "function" == typeof stream[i] && (this[i] = function(method) {
                        return function() {
                            return stream[method].apply(stream, arguments)
                        }
                    }(i));
                    var events = ["error", "close", "destroy", "pause", "resume"];
                    return forEach(events, function(ev) {
                        stream.on(ev, self.emit.bind(self, ev))
                    }), self._read = function(n) {
                        debug("wrapped _read", n), paused && (paused = !1, stream.resume())
                    }, self
                }, Readable._fromList = fromList
            }).call(this, require("_process"))
        }, {
            "./_stream_duplex": 140,
            "./internal/streams/BufferList": 145,
            _process: 138,
            buffer: 77,
            "buffer-shims": 76,
            "core-util-is": 78,
            events: 79,
            inherits: 81,
            isarray: 83,
            "process-nextick-args": 137,
            "string_decoder/": 152,
            util: 75
        }],
        143: [function(require, module, exports) {
            "use strict";

            function TransformState(stream) {
                this.afterTransform = function(er, data) {
                    return afterTransform(stream, er, data)
                }, this.needTransform = !1, this.transforming = !1, this.writecb = null, this.writechunk = null, this.writeencoding = null
            }

            function afterTransform(stream, er, data) {
                var ts = stream._transformState;
                ts.transforming = !1;
                var cb = ts.writecb;
                if (!cb) return stream.emit("error", new Error("no writecb in Transform class"));
                ts.writechunk = null, ts.writecb = null, null !== data && void 0 !== data && stream.push(data), cb(er);
                var rs = stream._readableState;
                rs.reading = !1, (rs.needReadable || rs.length < rs.highWaterMark) && stream._read(rs.highWaterMark)
            }

            function Transform(options) {
                if (!(this instanceof Transform)) return new Transform(options);
                Duplex.call(this, options), this._transformState = new TransformState(this);
                var stream = this;
                this._readableState.needReadable = !0, this._readableState.sync = !1, options && ("function" == typeof options.transform && (this._transform = options.transform), "function" == typeof options.flush && (this._flush = options.flush)), this.once("prefinish", function() {
                    "function" == typeof this._flush ? this._flush(function(er, data) {
                        done(stream, er, data)
                    }) : done(stream)
                })
            }

            function done(stream, er, data) {
                if (er) return stream.emit("error", er);
                null !== data && void 0 !== data && stream.push(data);
                var ws = stream._writableState,
                    ts = stream._transformState;
                if (ws.length) throw new Error("Calling transform done when ws.length != 0");
                if (ts.transforming) throw new Error("Calling transform done when still transforming");
                return stream.push(null)
            }
            module.exports = Transform;
            var Duplex = require("./_stream_duplex"),
                util = require("core-util-is");
            util.inherits = require("inherits"), util.inherits(Transform, Duplex), Transform.prototype.push = function(chunk, encoding) {
                return this._transformState.needTransform = !1, Duplex.prototype.push.call(this, chunk, encoding)
            }, Transform.prototype._transform = function(chunk, encoding, cb) {
                throw new Error("_transform() is not implemented")
            }, Transform.prototype._write = function(chunk, encoding, cb) {
                var ts = this._transformState;
                if (ts.writecb = cb, ts.writechunk = chunk, ts.writeencoding = encoding, !ts.transforming) {
                    var rs = this._readableState;
                    (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) && this._read(rs.highWaterMark)
                }
            }, Transform.prototype._read = function(n) {
                var ts = this._transformState;
                null !== ts.writechunk && ts.writecb && !ts.transforming ? (ts.transforming = !0, this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform)) : ts.needTransform = !0
            }
        }, {
            "./_stream_duplex": 140,
            "core-util-is": 78,
            inherits: 81
        }],
        144: [function(require, module, exports) {
            (function(process) {
                "use strict";

                function nop() {}

                function WriteReq(chunk, encoding, cb) {
                    this.chunk = chunk, this.encoding = encoding, this.callback = cb, this.next = null
                }

                function WritableState(options, stream) {
                    Duplex = Duplex || require("./_stream_duplex"), options = options || {}, this.objectMode = !!options.objectMode, stream instanceof Duplex && (this.objectMode = this.objectMode || !!options.writableObjectMode);
                    var hwm = options.highWaterMark,
                        defaultHwm = this.objectMode ? 16 : 16384;
                    this.highWaterMark = hwm || 0 === hwm ? hwm : defaultHwm, this.highWaterMark = ~~this.highWaterMark, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1;
                    var noDecode = options.decodeStrings === !1;
                    this.decodeStrings = !noDecode, this.defaultEncoding = options.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(er) {
                        onwrite(stream, er)
                    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new CorkedRequest(this)
                }

                function Writable(options) {
                    return Duplex = Duplex || require("./_stream_duplex"), realHasInstance.call(Writable, this) || this instanceof Duplex ? (this._writableState = new WritableState(options, this), this.writable = !0, options && ("function" == typeof options.write && (this._write = options.write), "function" == typeof options.writev && (this._writev = options.writev)), void Stream.call(this)) : new Writable(options)
                }

                function writeAfterEnd(stream, cb) {
                    var er = new Error("write after end");
                    stream.emit("error", er), processNextTick(cb, er)
                }

                function validChunk(stream, state, chunk, cb) {
                    var valid = !0,
                        er = !1;
                    return null === chunk ? er = new TypeError("May not write null values to stream") : "string" == typeof chunk || void 0 === chunk || state.objectMode || (er = new TypeError("Invalid non-string/buffer chunk")), er && (stream.emit("error", er), processNextTick(cb, er), valid = !1), valid
                }

                function decodeChunk(state, chunk, encoding) {
                    return state.objectMode || state.decodeStrings === !1 || "string" != typeof chunk || (chunk = bufferShim.from(chunk, encoding)), chunk
                }

                function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
                    isBuf || (chunk = decodeChunk(state, chunk, encoding), Buffer.isBuffer(chunk) && (encoding = "buffer"));
                    var len = state.objectMode ? 1 : chunk.length;
                    state.length += len;
                    var ret = state.length < state.highWaterMark;
                    if (ret || (state.needDrain = !0), state.writing || state.corked) {
                        var last = state.lastBufferedRequest;
                        state.lastBufferedRequest = new WriteReq(chunk, encoding, cb), last ? last.next = state.lastBufferedRequest : state.bufferedRequest = state.lastBufferedRequest, state.bufferedRequestCount += 1
                    } else doWrite(stream, state, !1, len, chunk, encoding, cb);
                    return ret
                }

                function doWrite(stream, state, writev, len, chunk, encoding, cb) {
                    state.writelen = len, state.writecb = cb, state.writing = !0, state.sync = !0, writev ? stream._writev(chunk, state.onwrite) : stream._write(chunk, encoding, state.onwrite), state.sync = !1
                }

                function onwriteError(stream, state, sync, er, cb) {
                    --state.pendingcb, sync ? processNextTick(cb, er) : cb(er), stream._writableState.errorEmitted = !0, stream.emit("error", er)
                }

                function onwriteStateUpdate(state) {
                    state.writing = !1, state.writecb = null, state.length -= state.writelen, state.writelen = 0
                }

                function onwrite(stream, er) {
                    var state = stream._writableState,
                        sync = state.sync,
                        cb = state.writecb;
                    if (onwriteStateUpdate(state), er) onwriteError(stream, state, sync, er, cb);
                    else {
                        var finished = needFinish(state);
                        finished || state.corked || state.bufferProcessing || !state.bufferedRequest || clearBuffer(stream, state), sync ? asyncWrite(afterWrite, stream, state, finished, cb) : afterWrite(stream, state, finished, cb)
                    }
                }

                function afterWrite(stream, state, finished, cb) {
                    finished || onwriteDrain(stream, state), state.pendingcb--, cb(), finishMaybe(stream, state)
                }

                function onwriteDrain(stream, state) {
                    0 === state.length && state.needDrain && (state.needDrain = !1, stream.emit("drain"))
                }

                function clearBuffer(stream, state) {
                    state.bufferProcessing = !0;
                    var entry = state.bufferedRequest;
                    if (stream._writev && entry && entry.next) {
                        var l = state.bufferedRequestCount,
                            buffer = new Array(l),
                            holder = state.corkedRequestsFree;
                        holder.entry = entry;
                        for (var count = 0; entry;) buffer[count] = entry, entry = entry.next, count += 1;
                        doWrite(stream, state, !0, state.length, buffer, "", holder.finish), state.pendingcb++, state.lastBufferedRequest = null, holder.next ? (state.corkedRequestsFree = holder.next, holder.next = null) : state.corkedRequestsFree = new CorkedRequest(state)
                    } else {
                        for (; entry;) {
                            var chunk = entry.chunk,
                                encoding = entry.encoding,
                                cb = entry.callback,
                                len = state.objectMode ? 1 : chunk.length;
                            if (doWrite(stream, state, !1, len, chunk, encoding, cb), entry = entry.next, state.writing) break
                        }
                        null === entry && (state.lastBufferedRequest = null)
                    }
                    state.bufferedRequestCount = 0, state.bufferedRequest = entry, state.bufferProcessing = !1
                }

                function needFinish(state) {
                    return state.ending && 0 === state.length && null === state.bufferedRequest && !state.finished && !state.writing
                }

                function prefinish(stream, state) {
                    state.prefinished || (state.prefinished = !0, stream.emit("prefinish"))
                }

                function finishMaybe(stream, state) {
                    var need = needFinish(state);
                    return need && (0 === state.pendingcb ? (prefinish(stream, state), state.finished = !0, stream.emit("finish")) : prefinish(stream, state)), need
                }

                function endWritable(stream, state, cb) {
                    state.ending = !0, finishMaybe(stream, state), cb && (state.finished ? processNextTick(cb) : stream.once("finish", cb)), state.ended = !0, stream.writable = !1
                }

                function CorkedRequest(state) {
                    var _this = this;
                    this.next = null, this.entry = null, this.finish = function(err) {
                        var entry = _this.entry;
                        for (_this.entry = null; entry;) {
                            var cb = entry.callback;
                            state.pendingcb--, cb(err), entry = entry.next
                        }
                        state.corkedRequestsFree ? state.corkedRequestsFree.next = _this : state.corkedRequestsFree = _this
                    }
                }
                module.exports = Writable;
                var Duplex, processNextTick = require("process-nextick-args"),
                    asyncWrite = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
                Writable.WritableState = WritableState;
                var util = require("core-util-is");
                util.inherits = require("inherits");
                var Stream, internalUtil = {
                    deprecate: require("util-deprecate")
                };
                ! function() {
                    try {
                        Stream = require("stream")
                    } catch (_) {} finally {
                        Stream || (Stream = require("events").EventEmitter)
                    }
                }();
                var Buffer = require("buffer").Buffer,
                    bufferShim = require("buffer-shims");
                util.inherits(Writable, Stream), WritableState.prototype.getBuffer = function() {
                        for (var current = this.bufferedRequest, out = []; current;) out.push(current), current = current.next;
                        return out
                    },
                    function() {
                        try {
                            Object.defineProperty(WritableState.prototype, "buffer", {
                                get: internalUtil.deprecate(function() {
                                    return this.getBuffer()
                                }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.")
                            })
                        } catch (_) {}
                    }();
                var realHasInstance;
                "function" == typeof Symbol && Symbol.hasInstance && "function" == typeof Function.prototype[Symbol.hasInstance] ? (realHasInstance = Function.prototype[Symbol.hasInstance], Object.defineProperty(Writable, Symbol.hasInstance, {
                    value: function(object) {
                        return realHasInstance.call(this, object) ? !0 : object && object._writableState instanceof WritableState
                    }
                })) : realHasInstance = function(object) {
                    return object instanceof this
                }, Writable.prototype.pipe = function() {
                    this.emit("error", new Error("Cannot pipe, not readable"))
                }, Writable.prototype.write = function(chunk, encoding, cb) {
                    var state = this._writableState,
                        ret = !1,
                        isBuf = Buffer.isBuffer(chunk);
                    return "function" == typeof encoding && (cb = encoding, encoding = null), isBuf ? encoding = "buffer" : encoding || (encoding = state.defaultEncoding), "function" != typeof cb && (cb = nop), state.ended ? writeAfterEnd(this, cb) : (isBuf || validChunk(this, state, chunk, cb)) && (state.pendingcb++, ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb)), ret
                }, Writable.prototype.cork = function() {
                    var state = this._writableState;
                    state.corked++
                }, Writable.prototype.uncork = function() {
                    var state = this._writableState;
                    state.corked && (state.corked--, state.writing || state.corked || state.finished || state.bufferProcessing || !state.bufferedRequest || clearBuffer(this, state))
                }, Writable.prototype.setDefaultEncoding = function(encoding) {
                    if ("string" == typeof encoding && (encoding = encoding.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + encoding);
                    return this._writableState.defaultEncoding = encoding, this
                }, Writable.prototype._write = function(chunk, encoding, cb) {
                    cb(new Error("_write() is not implemented"))
                }, Writable.prototype._writev = null, Writable.prototype.end = function(chunk, encoding, cb) {
                    var state = this._writableState;
                    "function" == typeof chunk ? (cb = chunk, chunk = null, encoding = null) : "function" == typeof encoding && (cb = encoding, encoding = null), null !== chunk && void 0 !== chunk && this.write(chunk, encoding), state.corked && (state.corked = 1, this.uncork()), state.ending || state.finished || endWritable(this, state, cb)
                }
            }).call(this, require("_process"))
        }, {
            "./_stream_duplex": 140,
            _process: 138,
            buffer: 77,
            "buffer-shims": 76,
            "core-util-is": 78,
            events: 79,
            inherits: 81,
            "process-nextick-args": 137,
            "util-deprecate": 154
        }],
        145: [function(require, module, exports) {
            "use strict";

            function BufferList() {
                this.head = null, this.tail = null, this.length = 0
            }
            var bufferShim = (require("buffer").Buffer, require("buffer-shims"));
            module.exports = BufferList, BufferList.prototype.push = function(v) {
                var entry = {
                    data: v,
                    next: null
                };
                this.length > 0 ? this.tail.next = entry : this.head = entry, this.tail = entry, ++this.length
            }, BufferList.prototype.unshift = function(v) {
                var entry = {
                    data: v,
                    next: this.head
                };
                0 === this.length && (this.tail = entry), this.head = entry, ++this.length
            }, BufferList.prototype.shift = function() {
                if (0 !== this.length) {
                    var ret = this.head.data;
                    return 1 === this.length ? this.head = this.tail = null : this.head = this.head.next, --this.length, ret
                }
            }, BufferList.prototype.clear = function() {
                this.head = this.tail = null, this.length = 0
            }, BufferList.prototype.join = function(s) {
                if (0 === this.length) return "";
                for (var p = this.head, ret = "" + p.data; p = p.next;) ret += s + p.data;
                return ret
            }, BufferList.prototype.concat = function(n) {
                if (0 === this.length) return bufferShim.alloc(0);
                if (1 === this.length) return this.head.data;
                for (var ret = bufferShim.allocUnsafe(n >>> 0), p = this.head, i = 0; p;) p.data.copy(ret, i), i += p.data.length, p = p.next;
                return ret
            }
        }, {
            buffer: 77,
            "buffer-shims": 76
        }],
        146: [function(require, module, exports) {
            module.exports = require("./lib/_stream_passthrough.js")
        }, {
            "./lib/_stream_passthrough.js": 141
        }],
        147: [function(require, module, exports) {
            (function(process) {
                var Stream = function() {
                    try {
                        return require("stream")
                    } catch (_) {}
                }();
                exports = module.exports = require("./lib/_stream_readable.js"), exports.Stream = Stream || exports, exports.Readable = exports, exports.Writable = require("./lib/_stream_writable.js"), exports.Duplex = require("./lib/_stream_duplex.js"), exports.Transform = require("./lib/_stream_transform.js"), exports.PassThrough = require("./lib/_stream_passthrough.js"), !process.browser && "disable" === process.env.READABLE_STREAM && Stream && (module.exports = Stream)
            }).call(this, require("_process"))
        }, {
            "./lib/_stream_duplex.js": 140,
            "./lib/_stream_passthrough.js": 141,
            "./lib/_stream_readable.js": 142,
            "./lib/_stream_transform.js": 143,
            "./lib/_stream_writable.js": 144,
            _process: 138
        }],
        148: [function(require, module, exports) {
            module.exports = require("./lib/_stream_transform.js")
        }, {
            "./lib/_stream_transform.js": 143
        }],
        149: [function(require, module, exports) {
            module.exports = require("./lib/_stream_writable.js")
        }, {
            "./lib/_stream_writable.js": 144
        }],
        150: [function(require, module, exports) {
            (function(Buffer) {
                ! function(sax) {
                    function SAXParser(strict, opt) {
                        if (!(this instanceof SAXParser)) return new SAXParser(strict, opt);
                        var parser = this;
                        clearBuffers(parser), parser.q = parser.c = "", parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH, parser.opt = opt || {}, parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags, parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase", parser.tags = [], parser.closed = parser.closedRoot = parser.sawRoot = !1, parser.tag = parser.error = null, parser.strict = !!strict, parser.noscript = !(!strict && !parser.opt.noscript), parser.state = S.BEGIN, parser.strictEntities = parser.opt.strictEntities, parser.ENTITIES = parser.strictEntities ? Object.create(sax.XML_ENTITIES) : Object.create(sax.ENTITIES), parser.attribList = [], parser.opt.xmlns && (parser.ns = Object.create(rootNS)), parser.trackPosition = parser.opt.position !== !1, parser.trackPosition && (parser.position = parser.line = parser.column = 0), emit(parser, "onready")
                    }

                    function checkBufferLength(parser) {
                        for (var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10), maxActual = 0, i = 0, l = buffers.length; l > i; i++) {
                            var len = parser[buffers[i]].length;
                            if (len > maxAllowed) switch (buffers[i]) {
                                case "textNode":
                                    closeText(parser);
                                    break;
                                case "cdata":
                                    emitNode(parser, "oncdata", parser.cdata), parser.cdata = "";
                                    break;
                                case "script":
                                    emitNode(parser, "onscript", parser.script), parser.script = "";
                                    break;
                                default:
                                    error(parser, "Max buffer length exceeded: " + buffers[i])
                            }
                            maxActual = Math.max(maxActual, len)
                        }
                        var m = sax.MAX_BUFFER_LENGTH - maxActual;
                        parser.bufferCheckPosition = m + parser.position
                    }

                    function clearBuffers(parser) {
                        for (var i = 0, l = buffers.length; l > i; i++) parser[buffers[i]] = ""
                    }

                    function flushBuffers(parser) {
                        closeText(parser), "" !== parser.cdata && (emitNode(parser, "oncdata", parser.cdata), parser.cdata = ""), "" !== parser.script && (emitNode(parser, "onscript", parser.script), parser.script = "")
                    }

                    function createStream(strict, opt) {
                        return new SAXStream(strict, opt)
                    }

                    function SAXStream(strict, opt) {
                        if (!(this instanceof SAXStream)) return new SAXStream(strict, opt);
                        Stream.apply(this), this._parser = new SAXParser(strict, opt), this.writable = !0, this.readable = !0;
                        var me = this;
                        this._parser.onend = function() {
                            me.emit("end")
                        }, this._parser.onerror = function(er) {
                            me.emit("error", er), me._parser.error = null
                        }, this._decoder = null, streamWraps.forEach(function(ev) {
                            Object.defineProperty(me, "on" + ev, {
                                get: function() {
                                    return me._parser["on" + ev]
                                },
                                set: function(h) {
                                    return h ? void me.on(ev, h) : (me.removeAllListeners(ev), me._parser["on" + ev] = h, h)
                                },
                                enumerable: !0,
                                configurable: !1
                            })
                        })
                    }

                    function charClass(str) {
                        return str.split("").reduce(function(s, c) {
                            return s[c] = !0, s
                        }, {})
                    }

                    function isRegExp(c) {
                        return "[object RegExp]" === Object.prototype.toString.call(c)
                    }

                    function is(charclass, c) {
                        return isRegExp(charclass) ? !!c.match(charclass) : charclass[c]
                    }

                    function not(charclass, c) {
                        return !is(charclass, c)
                    }

                    function emit(parser, event, data) {
                        parser[event] && parser[event](data)
                    }

                    function emitNode(parser, nodeType, data) {
                        parser.textNode && closeText(parser), emit(parser, nodeType, data)
                    }

                    function closeText(parser) {
                        parser.textNode = textopts(parser.opt, parser.textNode), parser.textNode && emit(parser, "ontext", parser.textNode), parser.textNode = ""
                    }

                    function textopts(opt, text) {
                        return opt.trim && (text = text.trim()), opt.normalize && (text = text.replace(/\s+/g, " ")), text
                    }

                    function error(parser, er) {
                        return closeText(parser), parser.trackPosition && (er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c), er = new Error(er), parser.error = er, emit(parser, "onerror", er), parser
                    }

                    function end(parser) {
                        return parser.sawRoot && !parser.closedRoot && strictFail(parser, "Unclosed root tag"), parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT && error(parser, "Unexpected end"), closeText(parser), parser.c = "", parser.closed = !0, emit(parser, "onend"), SAXParser.call(parser, parser.strict, parser.opt), parser
                    }

                    function strictFail(parser, message) {
                        if ("object" != typeof parser || !(parser instanceof SAXParser)) throw new Error("bad call to strictFail");
                        parser.strict && error(parser, message)
                    }

                    function newTag(parser) {
                        parser.strict || (parser.tagName = parser.tagName[parser.looseCase]());
                        var parent = parser.tags[parser.tags.length - 1] || parser,
                            tag = parser.tag = {
                                name: parser.tagName,
                                attributes: {}
                            };
                        parser.opt.xmlns && (tag.ns = parent.ns), parser.attribList.length = 0
                    }

                    function qname(name, attribute) {
                        var i = name.indexOf(":"),
                            qualName = 0 > i ? ["", name] : name.split(":"),
                            prefix = qualName[0],
                            local = qualName[1];
                        return attribute && "xmlns" === name && (prefix = "xmlns", local = ""), {
                            prefix: prefix,
                            local: local
                        }
                    }

                    function attrib(parser) {
                        if (parser.strict || (parser.attribName = parser.attribName[parser.looseCase]()), -1 !== parser.attribList.indexOf(parser.attribName) || parser.tag.attributes.hasOwnProperty(parser.attribName)) return void(parser.attribName = parser.attribValue = "");
                        if (parser.opt.xmlns) {
                            var qn = qname(parser.attribName, !0),
                                prefix = qn.prefix,
                                local = qn.local;
                            if ("xmlns" === prefix)
                                if ("xml" === local && parser.attribValue !== XML_NAMESPACE) strictFail(parser, "xml: prefix must be bound to " + XML_NAMESPACE + "\nActual: " + parser.attribValue);
                                else if ("xmlns" === local && parser.attribValue !== XMLNS_NAMESPACE) strictFail(parser, "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\nActual: " + parser.attribValue);
                            else {
                                var tag = parser.tag,
                                    parent = parser.tags[parser.tags.length - 1] || parser;
                                tag.ns === parent.ns && (tag.ns = Object.create(parent.ns)), tag.ns[local] = parser.attribValue
                            }
                            parser.attribList.push([parser.attribName, parser.attribValue])
                        } else parser.tag.attributes[parser.attribName] = parser.attribValue, emitNode(parser, "onattribute", {
                            name: parser.attribName,
                            value: parser.attribValue
                        });
                        parser.attribName = parser.attribValue = ""
                    }

                    function openTag(parser, selfClosing) {
                        if (parser.opt.xmlns) {
                            var tag = parser.tag,
                                qn = qname(parser.tagName);
                            tag.prefix = qn.prefix, tag.local = qn.local, tag.uri = tag.ns[qn.prefix] || "", tag.prefix && !tag.uri && (strictFail(parser, "Unbound namespace prefix: " + JSON.stringify(parser.tagName)), tag.uri = qn.prefix);
                            var parent = parser.tags[parser.tags.length - 1] || parser;
                            tag.ns && parent.ns !== tag.ns && Object.keys(tag.ns).forEach(function(p) {
                                emitNode(parser, "onopennamespace", {
                                    prefix: p,
                                    uri: tag.ns[p]
                                })
                            });
                            for (var i = 0, l = parser.attribList.length; l > i; i++) {
                                var nv = parser.attribList[i],
                                    name = nv[0],
                                    value = nv[1],
                                    qualName = qname(name, !0),
                                    prefix = qualName.prefix,
                                    local = qualName.local,
                                    uri = "" === prefix ? "" : tag.ns[prefix] || "",
                                    a = {
                                        name: name,
                                        value: value,
                                        prefix: prefix,
                                        local: local,
                                        uri: uri
                                    };
                                prefix && "xmlns" !== prefix && !uri && (strictFail(parser, "Unbound namespace prefix: " + JSON.stringify(prefix)), a.uri = prefix), parser.tag.attributes[name] = a, emitNode(parser, "onattribute", a)
                            }
                            parser.attribList.length = 0
                        }
                        parser.tag.isSelfClosing = !!selfClosing, parser.sawRoot = !0, parser.tags.push(parser.tag), emitNode(parser, "onopentag", parser.tag), selfClosing || (parser.noscript || "script" !== parser.tagName.toLowerCase() ? parser.state = S.TEXT : parser.state = S.SCRIPT, parser.tag = null, parser.tagName = ""), parser.attribName = parser.attribValue = "", parser.attribList.length = 0
                    }

                    function closeTag(parser) {
                        if (!parser.tagName) return strictFail(parser, "Weird empty close tag."), parser.textNode += "</>", void(parser.state = S.TEXT);
                        if (parser.script) {
                            if ("script" !== parser.tagName) return parser.script += "</" + parser.tagName + ">", parser.tagName = "", void(parser.state = S.SCRIPT);
                            emitNode(parser, "onscript", parser.script), parser.script = ""
                        }
                        var t = parser.tags.length,
                            tagName = parser.tagName;
                        parser.strict || (tagName = tagName[parser.looseCase]());
                        for (var closeTo = tagName; t--;) {
                            var close = parser.tags[t];
                            if (close.name === closeTo) break;
                            strictFail(parser, "Unexpected close tag")
                        }
                        if (0 > t) return strictFail(parser, "Unmatched closing tag: " + parser.tagName), parser.textNode += "</" + parser.tagName + ">", void(parser.state = S.TEXT);
                        parser.tagName = tagName;
                        for (var s = parser.tags.length; s-- > t;) {
                            var tag = parser.tag = parser.tags.pop();
                            parser.tagName = parser.tag.name, emitNode(parser, "onclosetag", parser.tagName);
                            var x = {};
                            for (var i in tag.ns) x[i] = tag.ns[i];
                            var parent = parser.tags[parser.tags.length - 1] || parser;
                            parser.opt.xmlns && tag.ns !== parent.ns && Object.keys(tag.ns).forEach(function(p) {
                                var n = tag.ns[p];
                                emitNode(parser, "onclosenamespace", {
                                    prefix: p,
                                    uri: n
                                })
                            })
                        }
                        0 === t && (parser.closedRoot = !0), parser.tagName = parser.attribValue = parser.attribName = "", parser.attribList.length = 0, parser.state = S.TEXT
                    }

                    function parseEntity(parser) {
                        var num, entity = parser.entity,
                            entityLC = entity.toLowerCase(),
                            numStr = "";
                        return parser.ENTITIES[entity] ? parser.ENTITIES[entity] : parser.ENTITIES[entityLC] ? parser.ENTITIES[entityLC] : (entity = entityLC, "#" === entity.charAt(0) && ("x" === entity.charAt(1) ? (entity = entity.slice(2), num = parseInt(entity, 16), numStr = num.toString(16)) : (entity = entity.slice(1), num = parseInt(entity, 10), numStr = num.toString(10))), entity = entity.replace(/^0+/, ""), numStr.toLowerCase() !== entity ? (strictFail(parser, "Invalid character entity"), "&" + parser.entity + ";") : String.fromCodePoint(num))
                    }

                    function beginWhiteSpace(parser, c) {
                        "<" === c ? (parser.state = S.OPEN_WAKA, parser.startTagPosition = parser.position) : not(whitespace, c) && (strictFail(parser, "Non-whitespace before first tag."), parser.textNode = c, parser.state = S.TEXT)
                    }

                    function charAt(chunk, i) {
                        var result = "";
                        return i < chunk.length && (result = chunk.charAt(i)), result
                    }

                    function write(chunk) {
                        var parser = this;
                        if (this.error) throw this.error;
                        if (parser.closed) return error(parser, "Cannot write after close. Assign an onready handler.");
                        if (null === chunk) return end(parser);
                        "object" == typeof chunk && (chunk = chunk.toString());
                        for (var i = 0, c = "";;) {
                            if (c = charAt(chunk, i++), parser.c = c, !c) break;
                            switch (parser.trackPosition && (parser.position++, "\n" === c ? (parser.line++, parser.column = 0) : parser.column++), parser.state) {
                                case S.BEGIN:
                                    if (parser.state = S.BEGIN_WHITESPACE, "\ufeff" === c) continue;
                                    beginWhiteSpace(parser, c);
                                    continue;
                                case S.BEGIN_WHITESPACE:
                                    beginWhiteSpace(parser, c);
                                    continue;
                                case S.TEXT:
                                    if (parser.sawRoot && !parser.closedRoot) {
                                        for (var starti = i - 1; c && "<" !== c && "&" !== c;) c = charAt(chunk, i++), c && parser.trackPosition && (parser.position++, "\n" === c ? (parser.line++, parser.column = 0) : parser.column++);
                                        parser.textNode += chunk.substring(starti, i - 1)
                                    }
                                    "<" !== c || parser.sawRoot && parser.closedRoot && !parser.strict ? (!not(whitespace, c) || parser.sawRoot && !parser.closedRoot || strictFail(parser, "Text data outside of root node."), "&" === c ? parser.state = S.TEXT_ENTITY : parser.textNode += c) : (parser.state = S.OPEN_WAKA, parser.startTagPosition = parser.position);
                                    continue;
                                case S.SCRIPT:
                                    "<" === c ? parser.state = S.SCRIPT_ENDING : parser.script += c;
                                    continue;
                                case S.SCRIPT_ENDING:
                                    "/" === c ? parser.state = S.CLOSE_TAG : (parser.script += "<" + c, parser.state = S.SCRIPT);
                                    continue;
                                case S.OPEN_WAKA:
                                    if ("!" === c) parser.state = S.SGML_DECL, parser.sgmlDecl = "";
                                    else if (is(whitespace, c));
                                    else if (is(nameStart, c)) parser.state = S.OPEN_TAG, parser.tagName = c;
                                    else if ("/" === c) parser.state = S.CLOSE_TAG, parser.tagName = "";
                                    else if ("?" === c) parser.state = S.PROC_INST, parser.procInstName = parser.procInstBody = "";
                                    else {
                                        if (strictFail(parser, "Unencoded <"), parser.startTagPosition + 1 < parser.position) {
                                            var pad = parser.position - parser.startTagPosition;
                                            c = new Array(pad).join(" ") + c
                                        }
                                        parser.textNode += "<" + c, parser.state = S.TEXT
                                    }
                                    continue;
                                case S.SGML_DECL:
                                    (parser.sgmlDecl + c).toUpperCase() === CDATA ? (emitNode(parser, "onopencdata"), parser.state = S.CDATA, parser.sgmlDecl = "", parser.cdata = "") : parser.sgmlDecl + c === "--" ? (parser.state = S.COMMENT, parser.comment = "", parser.sgmlDecl = "") : (parser.sgmlDecl + c).toUpperCase() === DOCTYPE ? (parser.state = S.DOCTYPE, (parser.doctype || parser.sawRoot) && strictFail(parser, "Inappropriately located doctype declaration"), parser.doctype = "", parser.sgmlDecl = "") : ">" === c ? (emitNode(parser, "onsgmldeclaration", parser.sgmlDecl), parser.sgmlDecl = "", parser.state = S.TEXT) : is(quote, c) ? (parser.state = S.SGML_DECL_QUOTED, parser.sgmlDecl += c) : parser.sgmlDecl += c;
                                    continue;
                                case S.SGML_DECL_QUOTED:
                                    c === parser.q && (parser.state = S.SGML_DECL,
                                        parser.q = ""), parser.sgmlDecl += c;
                                    continue;
                                case S.DOCTYPE:
                                    ">" === c ? (parser.state = S.TEXT, emitNode(parser, "ondoctype", parser.doctype), parser.doctype = !0) : (parser.doctype += c, "[" === c ? parser.state = S.DOCTYPE_DTD : is(quote, c) && (parser.state = S.DOCTYPE_QUOTED, parser.q = c));
                                    continue;
                                case S.DOCTYPE_QUOTED:
                                    parser.doctype += c, c === parser.q && (parser.q = "", parser.state = S.DOCTYPE);
                                    continue;
                                case S.DOCTYPE_DTD:
                                    parser.doctype += c, "]" === c ? parser.state = S.DOCTYPE : is(quote, c) && (parser.state = S.DOCTYPE_DTD_QUOTED, parser.q = c);
                                    continue;
                                case S.DOCTYPE_DTD_QUOTED:
                                    parser.doctype += c, c === parser.q && (parser.state = S.DOCTYPE_DTD, parser.q = "");
                                    continue;
                                case S.COMMENT:
                                    "-" === c ? parser.state = S.COMMENT_ENDING : parser.comment += c;
                                    continue;
                                case S.COMMENT_ENDING:
                                    "-" === c ? (parser.state = S.COMMENT_ENDED, parser.comment = textopts(parser.opt, parser.comment), parser.comment && emitNode(parser, "oncomment", parser.comment), parser.comment = "") : (parser.comment += "-" + c, parser.state = S.COMMENT);
                                    continue;
                                case S.COMMENT_ENDED:
                                    ">" !== c ? (strictFail(parser, "Malformed comment"), parser.comment += "--" + c, parser.state = S.COMMENT) : parser.state = S.TEXT;
                                    continue;
                                case S.CDATA:
                                    "]" === c ? parser.state = S.CDATA_ENDING : parser.cdata += c;
                                    continue;
                                case S.CDATA_ENDING:
                                    "]" === c ? parser.state = S.CDATA_ENDING_2 : (parser.cdata += "]" + c, parser.state = S.CDATA);
                                    continue;
                                case S.CDATA_ENDING_2:
                                    ">" === c ? (parser.cdata && emitNode(parser, "oncdata", parser.cdata), emitNode(parser, "onclosecdata"), parser.cdata = "", parser.state = S.TEXT) : "]" === c ? parser.cdata += "]" : (parser.cdata += "]]" + c, parser.state = S.CDATA);
                                    continue;
                                case S.PROC_INST:
                                    "?" === c ? parser.state = S.PROC_INST_ENDING : is(whitespace, c) ? parser.state = S.PROC_INST_BODY : parser.procInstName += c;
                                    continue;
                                case S.PROC_INST_BODY:
                                    if (!parser.procInstBody && is(whitespace, c)) continue;
                                    "?" === c ? parser.state = S.PROC_INST_ENDING : parser.procInstBody += c;
                                    continue;
                                case S.PROC_INST_ENDING:
                                    ">" === c ? (emitNode(parser, "onprocessinginstruction", {
                                        name: parser.procInstName,
                                        body: parser.procInstBody
                                    }), parser.procInstName = parser.procInstBody = "", parser.state = S.TEXT) : (parser.procInstBody += "?" + c, parser.state = S.PROC_INST_BODY);
                                    continue;
                                case S.OPEN_TAG:
                                    is(nameBody, c) ? parser.tagName += c : (newTag(parser), ">" === c ? openTag(parser) : "/" === c ? parser.state = S.OPEN_TAG_SLASH : (not(whitespace, c) && strictFail(parser, "Invalid character in tag name"), parser.state = S.ATTRIB));
                                    continue;
                                case S.OPEN_TAG_SLASH:
                                    ">" === c ? (openTag(parser, !0), closeTag(parser)) : (strictFail(parser, "Forward-slash in opening tag not followed by >"), parser.state = S.ATTRIB);
                                    continue;
                                case S.ATTRIB:
                                    if (is(whitespace, c)) continue;
                                    ">" === c ? openTag(parser) : "/" === c ? parser.state = S.OPEN_TAG_SLASH : is(nameStart, c) ? (parser.attribName = c, parser.attribValue = "", parser.state = S.ATTRIB_NAME) : strictFail(parser, "Invalid attribute name");
                                    continue;
                                case S.ATTRIB_NAME:
                                    "=" === c ? parser.state = S.ATTRIB_VALUE : ">" === c ? (strictFail(parser, "Attribute without value"), parser.attribValue = parser.attribName, attrib(parser), openTag(parser)) : is(whitespace, c) ? parser.state = S.ATTRIB_NAME_SAW_WHITE : is(nameBody, c) ? parser.attribName += c : strictFail(parser, "Invalid attribute name");
                                    continue;
                                case S.ATTRIB_NAME_SAW_WHITE:
                                    if ("=" === c) parser.state = S.ATTRIB_VALUE;
                                    else {
                                        if (is(whitespace, c)) continue;
                                        strictFail(parser, "Attribute without value"), parser.tag.attributes[parser.attribName] = "", parser.attribValue = "", emitNode(parser, "onattribute", {
                                            name: parser.attribName,
                                            value: ""
                                        }), parser.attribName = "", ">" === c ? openTag(parser) : is(nameStart, c) ? (parser.attribName = c, parser.state = S.ATTRIB_NAME) : (strictFail(parser, "Invalid attribute name"), parser.state = S.ATTRIB)
                                    }
                                    continue;
                                case S.ATTRIB_VALUE:
                                    if (is(whitespace, c)) continue;
                                    is(quote, c) ? (parser.q = c, parser.state = S.ATTRIB_VALUE_QUOTED) : (strictFail(parser, "Unquoted attribute value"), parser.state = S.ATTRIB_VALUE_UNQUOTED, parser.attribValue = c);
                                    continue;
                                case S.ATTRIB_VALUE_QUOTED:
                                    if (c !== parser.q) {
                                        "&" === c ? parser.state = S.ATTRIB_VALUE_ENTITY_Q : parser.attribValue += c;
                                        continue
                                    }
                                    attrib(parser), parser.q = "", parser.state = S.ATTRIB_VALUE_CLOSED;
                                    continue;
                                case S.ATTRIB_VALUE_CLOSED:
                                    is(whitespace, c) ? parser.state = S.ATTRIB : ">" === c ? openTag(parser) : "/" === c ? parser.state = S.OPEN_TAG_SLASH : is(nameStart, c) ? (strictFail(parser, "No whitespace between attributes"), parser.attribName = c, parser.attribValue = "", parser.state = S.ATTRIB_NAME) : strictFail(parser, "Invalid attribute name");
                                    continue;
                                case S.ATTRIB_VALUE_UNQUOTED:
                                    if (not(attribEnd, c)) {
                                        "&" === c ? parser.state = S.ATTRIB_VALUE_ENTITY_U : parser.attribValue += c;
                                        continue
                                    }
                                    attrib(parser), ">" === c ? openTag(parser) : parser.state = S.ATTRIB;
                                    continue;
                                case S.CLOSE_TAG:
                                    if (parser.tagName) ">" === c ? closeTag(parser) : is(nameBody, c) ? parser.tagName += c : parser.script ? (parser.script += "</" + parser.tagName, parser.tagName = "", parser.state = S.SCRIPT) : (not(whitespace, c) && strictFail(parser, "Invalid tagname in closing tag"), parser.state = S.CLOSE_TAG_SAW_WHITE);
                                    else {
                                        if (is(whitespace, c)) continue;
                                        not(nameStart, c) ? parser.script ? (parser.script += "</" + c, parser.state = S.SCRIPT) : strictFail(parser, "Invalid tagname in closing tag.") : parser.tagName = c
                                    }
                                    continue;
                                case S.CLOSE_TAG_SAW_WHITE:
                                    if (is(whitespace, c)) continue;
                                    ">" === c ? closeTag(parser) : strictFail(parser, "Invalid characters in closing tag");
                                    continue;
                                case S.TEXT_ENTITY:
                                case S.ATTRIB_VALUE_ENTITY_Q:
                                case S.ATTRIB_VALUE_ENTITY_U:
                                    var returnState, buffer;
                                    switch (parser.state) {
                                        case S.TEXT_ENTITY:
                                            returnState = S.TEXT, buffer = "textNode";
                                            break;
                                        case S.ATTRIB_VALUE_ENTITY_Q:
                                            returnState = S.ATTRIB_VALUE_QUOTED, buffer = "attribValue";
                                            break;
                                        case S.ATTRIB_VALUE_ENTITY_U:
                                            returnState = S.ATTRIB_VALUE_UNQUOTED, buffer = "attribValue"
                                    }
                                    ";" === c ? (parser[buffer] += parseEntity(parser), parser.entity = "", parser.state = returnState) : is(parser.entity.length ? entityBody : entityStart, c) ? parser.entity += c : (strictFail(parser, "Invalid character in entity name"), parser[buffer] += "&" + parser.entity + c, parser.entity = "", parser.state = returnState);
                                    continue;
                                default:
                                    throw new Error(parser, "Unknown state: " + parser.state)
                            }
                        }
                        return parser.position >= parser.bufferCheckPosition && checkBufferLength(parser), parser
                    }
                    sax.parser = function(strict, opt) {
                        return new SAXParser(strict, opt)
                    }, sax.SAXParser = SAXParser, sax.SAXStream = SAXStream, sax.createStream = createStream, sax.MAX_BUFFER_LENGTH = 65536;
                    var buffers = ["comment", "sgmlDecl", "textNode", "tagName", "doctype", "procInstName", "procInstBody", "entity", "attribName", "attribValue", "cdata", "script"];
                    sax.EVENTS = ["text", "processinginstruction", "sgmldeclaration", "doctype", "comment", "attribute", "opentag", "closetag", "opencdata", "cdata", "closecdata", "error", "end", "ready", "script", "opennamespace", "closenamespace"], Object.create || (Object.create = function(o) {
                        function F() {}
                        F.prototype = o;
                        var newf = new F;
                        return newf
                    }), Object.keys || (Object.keys = function(o) {
                        var a = [];
                        for (var i in o) o.hasOwnProperty(i) && a.push(i);
                        return a
                    }), SAXParser.prototype = {
                        end: function() {
                            end(this)
                        },
                        write: write,
                        resume: function() {
                            return this.error = null, this
                        },
                        close: function() {
                            return this.write(null)
                        },
                        flush: function() {
                            flushBuffers(this)
                        }
                    };
                    var Stream;
                    try {
                        Stream = require("stream").Stream
                    } catch (ex) {
                        Stream = function() {}
                    }
                    var streamWraps = sax.EVENTS.filter(function(ev) {
                        return "error" !== ev && "end" !== ev
                    });
                    SAXStream.prototype = Object.create(Stream.prototype, {
                        constructor: {
                            value: SAXStream
                        }
                    }), SAXStream.prototype.write = function(data) {
                        if ("function" == typeof Buffer && "function" == typeof Buffer.isBuffer && Buffer.isBuffer(data)) {
                            if (!this._decoder) {
                                var SD = require("string_decoder").StringDecoder;
                                this._decoder = new SD("utf8")
                            }
                            data = this._decoder.write(data)
                        }
                        return this._parser.write(data.toString()), this.emit("data", data), !0
                    }, SAXStream.prototype.end = function(chunk) {
                        return chunk && chunk.length && this.write(chunk), this._parser.end(), !0
                    }, SAXStream.prototype.on = function(ev, handler) {
                        var me = this;
                        return me._parser["on" + ev] || -1 === streamWraps.indexOf(ev) || (me._parser["on" + ev] = function() {
                            var args = 1 === arguments.length ? [arguments[0]] : Array.apply(null, arguments);
                            args.splice(0, 0, ev), me.emit.apply(me, args)
                        }), Stream.prototype.on.call(me, ev, handler)
                    };
                    var whitespace = "\r\n	 ",
                        number = "0124356789",
                        letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
                        quote = "'\"",
                        attribEnd = whitespace + ">",
                        CDATA = "[CDATA[",
                        DOCTYPE = "DOCTYPE",
                        XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace",
                        XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/",
                        rootNS = {
                            xml: XML_NAMESPACE,
                            xmlns: XMLNS_NAMESPACE
                        };
                    whitespace = charClass(whitespace), number = charClass(number), letter = charClass(letter);
                    var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,
                        nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/,
                        entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,
                        entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/;
                    quote = charClass(quote), attribEnd = charClass(attribEnd);
                    var S = 0;
                    sax.STATE = {
                        BEGIN: S++,
                        BEGIN_WHITESPACE: S++,
                        TEXT: S++,
                        TEXT_ENTITY: S++,
                        OPEN_WAKA: S++,
                        SGML_DECL: S++,
                        SGML_DECL_QUOTED: S++,
                        DOCTYPE: S++,
                        DOCTYPE_QUOTED: S++,
                        DOCTYPE_DTD: S++,
                        DOCTYPE_DTD_QUOTED: S++,
                        COMMENT_STARTING: S++,
                        COMMENT: S++,
                        COMMENT_ENDING: S++,
                        COMMENT_ENDED: S++,
                        CDATA: S++,
                        CDATA_ENDING: S++,
                        CDATA_ENDING_2: S++,
                        PROC_INST: S++,
                        PROC_INST_BODY: S++,
                        PROC_INST_ENDING: S++,
                        OPEN_TAG: S++,
                        OPEN_TAG_SLASH: S++,
                        ATTRIB: S++,
                        ATTRIB_NAME: S++,
                        ATTRIB_NAME_SAW_WHITE: S++,
                        ATTRIB_VALUE: S++,
                        ATTRIB_VALUE_QUOTED: S++,
                        ATTRIB_VALUE_CLOSED: S++,
                        ATTRIB_VALUE_UNQUOTED: S++,
                        ATTRIB_VALUE_ENTITY_Q: S++,
                        ATTRIB_VALUE_ENTITY_U: S++,
                        CLOSE_TAG: S++,
                        CLOSE_TAG_SAW_WHITE: S++,
                        SCRIPT: S++,
                        SCRIPT_ENDING: S++
                    }, sax.XML_ENTITIES = {
                        amp: "&",
                        gt: ">",
                        lt: "<",
                        quot: '"',
                        apos: "'"
                    }, sax.ENTITIES = {
                        amp: "&",
                        gt: ">",
                        lt: "<",
                        quot: '"',
                        apos: "'",
                        AElig: 198,
                        Aacute: 193,
                        Acirc: 194,
                        Agrave: 192,
                        Aring: 197,
                        Atilde: 195,
                        Auml: 196,
                        Ccedil: 199,
                        ETH: 208,
                        Eacute: 201,
                        Ecirc: 202,
                        Egrave: 200,
                        Euml: 203,
                        Iacute: 205,
                        Icirc: 206,
                        Igrave: 204,
                        Iuml: 207,
                        Ntilde: 209,
                        Oacute: 211,
                        Ocirc: 212,
                        Ograve: 210,
                        Oslash: 216,
                        Otilde: 213,
                        Ouml: 214,
                        THORN: 222,
                        Uacute: 218,
                        Ucirc: 219,
                        Ugrave: 217,
                        Uuml: 220,
                        Yacute: 221,
                        aacute: 225,
                        acirc: 226,
                        aelig: 230,
                        agrave: 224,
                        aring: 229,
                        atilde: 227,
                        auml: 228,
                        ccedil: 231,
                        eacute: 233,
                        ecirc: 234,
                        egrave: 232,
                        eth: 240,
                        euml: 235,
                        iacute: 237,
                        icirc: 238,
                        igrave: 236,
                        iuml: 239,
                        ntilde: 241,
                        oacute: 243,
                        ocirc: 244,
                        ograve: 242,
                        oslash: 248,
                        otilde: 245,
                        ouml: 246,
                        szlig: 223,
                        thorn: 254,
                        uacute: 250,
                        ucirc: 251,
                        ugrave: 249,
                        uuml: 252,
                        yacute: 253,
                        yuml: 255,
                        copy: 169,
                        reg: 174,
                        nbsp: 160,
                        iexcl: 161,
                        cent: 162,
                        pound: 163,
                        curren: 164,
                        yen: 165,
                        brvbar: 166,
                        sect: 167,
                        uml: 168,
                        ordf: 170,
                        laquo: 171,
                        not: 172,
                        shy: 173,
                        macr: 175,
                        deg: 176,
                        plusmn: 177,
                        sup1: 185,
                        sup2: 178,
                        sup3: 179,
                        acute: 180,
                        micro: 181,
                        para: 182,
                        middot: 183,
                        cedil: 184,
                        ordm: 186,
                        raquo: 187,
                        frac14: 188,
                        frac12: 189,
                        frac34: 190,
                        iquest: 191,
                        times: 215,
                        divide: 247,
                        OElig: 338,
                        oelig: 339,
                        Scaron: 352,
                        scaron: 353,
                        Yuml: 376,
                        fnof: 402,
                        circ: 710,
                        tilde: 732,
                        Alpha: 913,
                        Beta: 914,
                        Gamma: 915,
                        Delta: 916,
                        Epsilon: 917,
                        Zeta: 918,
                        Eta: 919,
                        Theta: 920,
                        Iota: 921,
                        Kappa: 922,
                        Lambda: 923,
                        Mu: 924,
                        Nu: 925,
                        Xi: 926,
                        Omicron: 927,
                        Pi: 928,
                        Rho: 929,
                        Sigma: 931,
                        Tau: 932,
                        Upsilon: 933,
                        Phi: 934,
                        Chi: 935,
                        Psi: 936,
                        Omega: 937,
                        alpha: 945,
                        beta: 946,
                        gamma: 947,
                        delta: 948,
                        epsilon: 949,
                        zeta: 950,
                        eta: 951,
                        theta: 952,
                        iota: 953,
                        kappa: 954,
                        lambda: 955,
                        mu: 956,
                        nu: 957,
                        xi: 958,
                        omicron: 959,
                        pi: 960,
                        rho: 961,
                        sigmaf: 962,
                        sigma: 963,
                        tau: 964,
                        upsilon: 965,
                        phi: 966,
                        chi: 967,
                        psi: 968,
                        omega: 969,
                        thetasym: 977,
                        upsih: 978,
                        piv: 982,
                        ensp: 8194,
                        emsp: 8195,
                        thinsp: 8201,
                        zwnj: 8204,
                        zwj: 8205,
                        lrm: 8206,
                        rlm: 8207,
                        ndash: 8211,
                        mdash: 8212,
                        lsquo: 8216,
                        rsquo: 8217,
                        sbquo: 8218,
                        ldquo: 8220,
                        rdquo: 8221,
                        bdquo: 8222,
                        dagger: 8224,
                        Dagger: 8225,
                        bull: 8226,
                        hellip: 8230,
                        permil: 8240,
                        prime: 8242,
                        Prime: 8243,
                        lsaquo: 8249,
                        rsaquo: 8250,
                        oline: 8254,
                        frasl: 8260,
                        euro: 8364,
                        image: 8465,
                        weierp: 8472,
                        real: 8476,
                        trade: 8482,
                        alefsym: 8501,
                        larr: 8592,
                        uarr: 8593,
                        rarr: 8594,
                        darr: 8595,
                        harr: 8596,
                        crarr: 8629,
                        lArr: 8656,
                        uArr: 8657,
                        rArr: 8658,
                        dArr: 8659,
                        hArr: 8660,
                        forall: 8704,
                        part: 8706,
                        exist: 8707,
                        empty: 8709,
                        nabla: 8711,
                        isin: 8712,
                        notin: 8713,
                        ni: 8715,
                        prod: 8719,
                        sum: 8721,
                        minus: 8722,
                        lowast: 8727,
                        radic: 8730,
                        prop: 8733,
                        infin: 8734,
                        ang: 8736,
                        and: 8743,
                        or: 8744,
                        cap: 8745,
                        cup: 8746,
                        "int": 8747,
                        there4: 8756,
                        sim: 8764,
                        cong: 8773,
                        asymp: 8776,
                        ne: 8800,
                        equiv: 8801,
                        le: 8804,
                        ge: 8805,
                        sub: 8834,
                        sup: 8835,
                        nsub: 8836,
                        sube: 8838,
                        supe: 8839,
                        oplus: 8853,
                        otimes: 8855,
                        perp: 8869,
                        sdot: 8901,
                        lceil: 8968,
                        rceil: 8969,
                        lfloor: 8970,
                        rfloor: 8971,
                        lang: 9001,
                        rang: 9002,
                        loz: 9674,
                        spades: 9824,
                        clubs: 9827,
                        hearts: 9829,
                        diams: 9830
                    }, Object.keys(sax.ENTITIES).forEach(function(key) {
                        var e = sax.ENTITIES[key],
                            s = "number" == typeof e ? String.fromCharCode(e) : e;
                        sax.ENTITIES[key] = s
                    });
                    for (var s in sax.STATE) sax.STATE[sax.STATE[s]] = s;
                    S = sax.STATE, String.fromCodePoint || ! function() {
                        var stringFromCharCode = String.fromCharCode,
                            floor = Math.floor,
                            fromCodePoint = function() {
                                var highSurrogate, lowSurrogate, MAX_SIZE = 16384,
                                    codeUnits = [],
                                    index = -1,
                                    length = arguments.length;
                                if (!length) return "";
                                for (var result = ""; ++index < length;) {
                                    var codePoint = Number(arguments[index]);
                                    if (!isFinite(codePoint) || 0 > codePoint || codePoint > 1114111 || floor(codePoint) !== codePoint) throw RangeError("Invalid code point: " + codePoint);
                                    65535 >= codePoint ? codeUnits.push(codePoint) : (codePoint -= 65536, highSurrogate = (codePoint >> 10) + 55296, lowSurrogate = codePoint % 1024 + 56320, codeUnits.push(highSurrogate, lowSurrogate)), (index + 1 === length || codeUnits.length > MAX_SIZE) && (result += stringFromCharCode.apply(null, codeUnits), codeUnits.length = 0)
                                }
                                return result
                            };
                        Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
                            value: fromCodePoint,
                            configurable: !0,
                            writable: !0
                        }) : String.fromCodePoint = fromCodePoint
                    }()
                }("undefined" == typeof exports ? this.sax = {} : exports)
            }).call(this, require("buffer").Buffer)
        }, {
            buffer: 77,
            stream: 151,
            string_decoder: 152
        }],
        151: [function(require, module, exports) {
            function Stream() {
                EE.call(this)
            }
            module.exports = Stream;
            var EE = require("events").EventEmitter,
                inherits = require("inherits");
            inherits(Stream, EE), Stream.Readable = require("readable-stream/readable.js"), Stream.Writable = require("readable-stream/writable.js"), Stream.Duplex = require("readable-stream/duplex.js"), Stream.Transform = require("readable-stream/transform.js"), Stream.PassThrough = require("readable-stream/passthrough.js"), Stream.Stream = Stream, Stream.prototype.pipe = function(dest, options) {
                function ondata(chunk) {
                    dest.writable && !1 === dest.write(chunk) && source.pause && source.pause()
                }

                function ondrain() {
                    source.readable && source.resume && source.resume()
                }

                function onend() {
                    didOnEnd || (didOnEnd = !0, dest.end())
                }

                function onclose() {
                    didOnEnd || (didOnEnd = !0, "function" == typeof dest.destroy && dest.destroy())
                }

                function onerror(er) {
                    if (cleanup(), 0 === EE.listenerCount(this, "error")) throw er
                }

                function cleanup() {
                    source.removeListener("data", ondata), dest.removeListener("drain", ondrain), source.removeListener("end", onend), source.removeListener("close", onclose), source.removeListener("error", onerror), dest.removeListener("error", onerror), source.removeListener("end", cleanup), source.removeListener("close", cleanup), dest.removeListener("close", cleanup)
                }
                var source = this;
                source.on("data", ondata), dest.on("drain", ondrain), dest._isStdio || options && options.end === !1 || (source.on("end", onend), source.on("close", onclose));
                var didOnEnd = !1;
                return source.on("error", onerror), dest.on("error", onerror), source.on("end", cleanup), source.on("close", cleanup), dest.on("close", cleanup), dest.emit("pipe", source), dest
            }
        }, {
            events: 79,
            inherits: 81,
            "readable-stream/duplex.js": 139,
            "readable-stream/passthrough.js": 146,
            "readable-stream/readable.js": 147,
            "readable-stream/transform.js": 148,
            "readable-stream/writable.js": 149
        }],
        152: [function(require, module, exports) {
            function assertEncoding(encoding) {
                if (encoding && !isBufferEncoding(encoding)) throw new Error("Unknown encoding: " + encoding)
            }

            function passThroughWrite(buffer) {
                return buffer.toString(this.encoding)
            }

            function utf16DetectIncompleteChar(buffer) {
                this.charReceived = buffer.length % 2, this.charLength = this.charReceived ? 2 : 0
            }

            function base64DetectIncompleteChar(buffer) {
                this.charReceived = buffer.length % 3, this.charLength = this.charReceived ? 3 : 0
            }
            var Buffer = require("buffer").Buffer,
                isBufferEncoding = Buffer.isEncoding || function(encoding) {
                    switch (encoding && encoding.toLowerCase()) {
                        case "hex":
                        case "utf8":
                        case "utf-8":
                        case "ascii":
                        case "binary":
                        case "base64":
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                        case "raw":
                            return !0;
                        default:
                            return !1
                    }
                },
                StringDecoder = exports.StringDecoder = function(encoding) {
                    switch (this.encoding = (encoding || "utf8").toLowerCase().replace(/[-_]/, ""), assertEncoding(encoding), this.encoding) {
                        case "utf8":
                            this.surrogateSize = 3;
                            break;
                        case "ucs2":
                        case "utf16le":
                            this.surrogateSize = 2, this.detectIncompleteChar = utf16DetectIncompleteChar;
                            break;
                        case "base64":
                            this.surrogateSize = 3, this.detectIncompleteChar = base64DetectIncompleteChar;
                            break;
                        default:
                            return void(this.write = passThroughWrite)
                    }
                    this.charBuffer = new Buffer(6), this.charReceived = 0, this.charLength = 0
                };
            StringDecoder.prototype.write = function(buffer) {
                for (var charStr = ""; this.charLength;) {
                    var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length;
                    if (buffer.copy(this.charBuffer, this.charReceived, 0, available), this.charReceived += available, this.charReceived < this.charLength) return "";
                    buffer = buffer.slice(available, buffer.length), charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
                    var charCode = charStr.charCodeAt(charStr.length - 1);
                    if (!(charCode >= 55296 && 56319 >= charCode)) {
                        if (this.charReceived = this.charLength = 0, 0 === buffer.length) return charStr;
                        break
                    }
                    this.charLength += this.surrogateSize, charStr = ""
                }
                this.detectIncompleteChar(buffer);
                var end = buffer.length;
                this.charLength && (buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end), end -= this.charReceived), charStr += buffer.toString(this.encoding, 0, end);
                var end = charStr.length - 1,
                    charCode = charStr.charCodeAt(end);
                if (charCode >= 55296 && 56319 >= charCode) {
                    var size = this.surrogateSize;
                    return this.charLength += size, this.charReceived += size, this.charBuffer.copy(this.charBuffer, size, 0, size), buffer.copy(this.charBuffer, 0, 0, size), charStr.substring(0, end)
                }
                return charStr
            }, StringDecoder.prototype.detectIncompleteChar = function(buffer) {
                for (var i = buffer.length >= 3 ? 3 : buffer.length; i > 0; i--) {
                    var c = buffer[buffer.length - i];
                    if (1 == i && c >> 5 == 6) {
                        this.charLength = 2;
                        break
                    }
                    if (2 >= i && c >> 4 == 14) {
                        this.charLength = 3;
                        break
                    }
                    if (3 >= i && c >> 3 == 30) {
                        this.charLength = 4;
                        break
                    }
                }
                this.charReceived = i
            }, StringDecoder.prototype.end = function(buffer) {
                var res = "";
                if (buffer && buffer.length && (res = this.write(buffer)), this.charReceived) {
                    var cr = this.charReceived,
                        buf = this.charBuffer,
                        enc = this.encoding;
                    res += buf.slice(0, cr).toString(enc)
                }
                return res
            }
        }, {
            buffer: 77
        }],
        153: [function(require, module, exports) {
            (function() {
                function createReduce(dir) {
                    function iterator(obj, iteratee, memo, keys, index, length) {
                        for (; index >= 0 && length > index; index += dir) {
                            var currentKey = keys ? keys[index] : index;
                            memo = iteratee(memo, obj[currentKey], currentKey, obj)
                        }
                        return memo
                    }
                    return function(obj, iteratee, memo, context) {
                        iteratee = optimizeCb(iteratee, context, 4);
                        var keys = !isArrayLike(obj) && _.keys(obj),
                            length = (keys || obj).length,
                            index = dir > 0 ? 0 : length - 1;
                        return arguments.length < 3 && (memo = obj[keys ? keys[index] : index], index += dir), iterator(obj, iteratee, memo, keys, index, length)
                    }
                }

                function createPredicateIndexFinder(dir) {
                    return function(array, predicate, context) {
                        predicate = cb(predicate, context);
                        for (var length = getLength(array), index = dir > 0 ? 0 : length - 1; index >= 0 && length > index; index += dir)
                            if (predicate(array[index], index, array)) return index;
                        return -1
                    }
                }

                function createIndexFinder(dir, predicateFind, sortedIndex) {
                    return function(array, item, idx) {
                        var i = 0,
                            length = getLength(array);
                        if ("number" == typeof idx) dir > 0 ? i = idx >= 0 ? idx : Math.max(idx + length, i) : length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
                        else if (sortedIndex && idx && length) return idx = sortedIndex(array, item), array[idx] === item ? idx : -1;
                        if (item !== item) return idx = predicateFind(slice.call(array, i, length), _.isNaN), idx >= 0 ? idx + i : -1;
                        for (idx = dir > 0 ? i : length - 1; idx >= 0 && length > idx; idx += dir)
                            if (array[idx] === item) return idx;
                        return -1
                    }
                }

                function collectNonEnumProps(obj, keys) {
                    var nonEnumIdx = nonEnumerableProps.length,
                        constructor = obj.constructor,
                        proto = _.isFunction(constructor) && constructor.prototype || ObjProto,
                        prop = "constructor";
                    for (_.has(obj, prop) && !_.contains(keys, prop) && keys.push(prop); nonEnumIdx--;) prop = nonEnumerableProps[nonEnumIdx], prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop) && keys.push(prop)
                }
                var root = this,
                    previousUnderscore = root._,
                    ArrayProto = Array.prototype,
                    ObjProto = Object.prototype,
                    FuncProto = Function.prototype,
                    push = ArrayProto.push,
                    slice = ArrayProto.slice,
                    toString = ObjProto.toString,
                    hasOwnProperty = ObjProto.hasOwnProperty,
                    nativeIsArray = Array.isArray,
                    nativeKeys = Object.keys,
                    nativeBind = FuncProto.bind,
                    nativeCreate = Object.create,
                    Ctor = function() {},
                    _ = function(obj) {
                        return obj instanceof _ ? obj : this instanceof _ ? void(this._wrapped = obj) : new _(obj)
                    };
                "undefined" != typeof exports ? ("undefined" != typeof module && module.exports && (exports = module.exports = _), exports._ = _) : root._ = _, _.VERSION = "1.8.3";
                var optimizeCb = function(func, context, argCount) {
                        if (void 0 === context) return func;
                        switch (null == argCount ? 3 : argCount) {
                            case 1:
                                return function(value) {
                                    return func.call(context, value)
                                };
                            case 2:
                                return function(value, other) {
                                    return func.call(context, value, other)
                                };
                            case 3:
                                return function(value, index, collection) {
                                    return func.call(context, value, index, collection)
                                };
                            case 4:
                                return function(accumulator, value, index, collection) {
                                    return func.call(context, accumulator, value, index, collection)
                                }
                        }
                        return function() {
                            return func.apply(context, arguments)
                        }
                    },
                    cb = function(value, context, argCount) {
                        return null == value ? _.identity : _.isFunction(value) ? optimizeCb(value, context, argCount) : _.isObject(value) ? _.matcher(value) : _.property(value)
                    };
                _.iteratee = function(value, context) {
                    return cb(value, context, 1 / 0)
                };
                var createAssigner = function(keysFunc, undefinedOnly) {
                        return function(obj) {
                            var length = arguments.length;
                            if (2 > length || null == obj) return obj;
                            for (var index = 1; length > index; index++)
                                for (var source = arguments[index], keys = keysFunc(source), l = keys.length, i = 0; l > i; i++) {
                                    var key = keys[i];
                                    undefinedOnly && void 0 !== obj[key] || (obj[key] = source[key])
                                }
                            return obj
                        }
                    },
                    baseCreate = function(prototype) {
                        if (!_.isObject(prototype)) return {};
                        if (nativeCreate) return nativeCreate(prototype);
                        Ctor.prototype = prototype;
                        var result = new Ctor;
                        return Ctor.prototype = null, result
                    },
                    property = function(key) {
                        return function(obj) {
                            return null == obj ? void 0 : obj[key]
                        }
                    },
                    MAX_ARRAY_INDEX = Math.pow(2, 53) - 1,
                    getLength = property("length"),
                    isArrayLike = function(collection) {
                        var length = getLength(collection);
                        return "number" == typeof length && length >= 0 && MAX_ARRAY_INDEX >= length
                    };
                _.each = _.forEach = function(obj, iteratee, context) {
                    iteratee = optimizeCb(iteratee, context);
                    var i, length;
                    if (isArrayLike(obj))
                        for (i = 0, length = obj.length; length > i; i++) iteratee(obj[i], i, obj);
                    else {
                        var keys = _.keys(obj);
                        for (i = 0, length = keys.length; length > i; i++) iteratee(obj[keys[i]], keys[i], obj)
                    }
                    return obj
                }, _.map = _.collect = function(obj, iteratee, context) {
                    iteratee = cb(iteratee, context);
                    for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, results = Array(length), index = 0; length > index; index++) {
                        var currentKey = keys ? keys[index] : index;
                        results[index] = iteratee(obj[currentKey], currentKey, obj)
                    }
                    return results
                }, _.reduce = _.foldl = _.inject = createReduce(1), _.reduceRight = _.foldr = createReduce(-1), _.find = _.detect = function(obj, predicate, context) {
                    var key;
                    return key = isArrayLike(obj) ? _.findIndex(obj, predicate, context) : _.findKey(obj, predicate, context), void 0 !== key && -1 !== key ? obj[key] : void 0
                }, _.filter = _.select = function(obj, predicate, context) {
                    var results = [];
                    return predicate = cb(predicate, context), _.each(obj, function(value, index, list) {
                        predicate(value, index, list) && results.push(value)
                    }), results
                }, _.reject = function(obj, predicate, context) {
                    return _.filter(obj, _.negate(cb(predicate)), context)
                }, _.every = _.all = function(obj, predicate, context) {
                    predicate = cb(predicate, context);
                    for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, index = 0; length > index; index++) {
                        var currentKey = keys ? keys[index] : index;
                        if (!predicate(obj[currentKey], currentKey, obj)) return !1
                    }
                    return !0
                }, _.some = _.any = function(obj, predicate, context) {
                    predicate = cb(predicate, context);
                    for (var keys = !isArrayLike(obj) && _.keys(obj), length = (keys || obj).length, index = 0; length > index; index++) {
                        var currentKey = keys ? keys[index] : index;
                        if (predicate(obj[currentKey], currentKey, obj)) return !0
                    }
                    return !1
                }, _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
                    return isArrayLike(obj) || (obj = _.values(obj)), ("number" != typeof fromIndex || guard) && (fromIndex = 0), _.indexOf(obj, item, fromIndex) >= 0
                }, _.invoke = function(obj, method) {
                    var args = slice.call(arguments, 2),
                        isFunc = _.isFunction(method);
                    return _.map(obj, function(value) {
                        var func = isFunc ? method : value[method];
                        return null == func ? func : func.apply(value, args)
                    })
                }, _.pluck = function(obj, key) {
                    return _.map(obj, _.property(key))
                }, _.where = function(obj, attrs) {
                    return _.filter(obj, _.matcher(attrs))
                }, _.findWhere = function(obj, attrs) {
                    return _.find(obj, _.matcher(attrs))
                }, _.max = function(obj, iteratee, context) {
                    var value, computed, result = -(1 / 0),
                        lastComputed = -(1 / 0);
                    if (null == iteratee && null != obj) {
                        obj = isArrayLike(obj) ? obj : _.values(obj);
                        for (var i = 0, length = obj.length; length > i; i++) value = obj[i], value > result && (result = value)
                    } else iteratee = cb(iteratee, context), _.each(obj, function(value, index, list) {
                        computed = iteratee(value, index, list), (computed > lastComputed || computed === -(1 / 0) && result === -(1 / 0)) && (result = value, lastComputed = computed)
                    });
                    return result
                }, _.min = function(obj, iteratee, context) {
                    var value, computed, result = 1 / 0,
                        lastComputed = 1 / 0;
                    if (null == iteratee && null != obj) {
                        obj = isArrayLike(obj) ? obj : _.values(obj);
                        for (var i = 0, length = obj.length; length > i; i++) value = obj[i], result > value && (result = value)
                    } else iteratee = cb(iteratee, context), _.each(obj, function(value, index, list) {
                        computed = iteratee(value, index, list), (lastComputed > computed || computed === 1 / 0 && result === 1 / 0) && (result = value, lastComputed = computed)
                    });
                    return result
                }, _.shuffle = function(obj) {
                    for (var rand, set = isArrayLike(obj) ? obj : _.values(obj), length = set.length, shuffled = Array(length), index = 0; length > index; index++) rand = _.random(0, index), rand !== index && (shuffled[index] = shuffled[rand]), shuffled[rand] = set[index];
                    return shuffled
                }, _.sample = function(obj, n, guard) {
                    return null == n || guard ? (isArrayLike(obj) || (obj = _.values(obj)), obj[_.random(obj.length - 1)]) : _.shuffle(obj).slice(0, Math.max(0, n))
                }, _.sortBy = function(obj, iteratee, context) {
                    return iteratee = cb(iteratee, context), _.pluck(_.map(obj, function(value, index, list) {
                        return {
                            value: value,
                            index: index,
                            criteria: iteratee(value, index, list)
                        }
                    }).sort(function(left, right) {
                        var a = left.criteria,
                            b = right.criteria;
                        if (a !== b) {
                            if (a > b || void 0 === a) return 1;
                            if (b > a || void 0 === b) return -1
                        }
                        return left.index - right.index
                    }), "value")
                };
                var group = function(behavior) {
                    return function(obj, iteratee, context) {
                        var result = {};
                        return iteratee = cb(iteratee, context), _.each(obj, function(value, index) {
                            var key = iteratee(value, index, obj);
                            behavior(result, value, key)
                        }), result
                    }
                };
                _.groupBy = group(function(result, value, key) {
                    _.has(result, key) ? result[key].push(value) : result[key] = [value]
                }), _.indexBy = group(function(result, value, key) {
                    result[key] = value
                }), _.countBy = group(function(result, value, key) {
                    _.has(result, key) ? result[key]++ : result[key] = 1
                }), _.toArray = function(obj) {
                    return obj ? _.isArray(obj) ? slice.call(obj) : isArrayLike(obj) ? _.map(obj, _.identity) : _.values(obj) : []
                }, _.size = function(obj) {
                    return null == obj ? 0 : isArrayLike(obj) ? obj.length : _.keys(obj).length
                }, _.partition = function(obj, predicate, context) {
                    predicate = cb(predicate, context);
                    var pass = [],
                        fail = [];
                    return _.each(obj, function(value, key, obj) {
                        (predicate(value, key, obj) ? pass : fail).push(value)
                    }), [pass, fail]
                }, _.first = _.head = _.take = function(array, n, guard) {
                    return null == array ? void 0 : null == n || guard ? array[0] : _.initial(array, array.length - n)
                }, _.initial = function(array, n, guard) {
                    return slice.call(array, 0, Math.max(0, array.length - (null == n || guard ? 1 : n)))
                }, _.last = function(array, n, guard) {
                    return null == array ? void 0 : null == n || guard ? array[array.length - 1] : _.rest(array, Math.max(0, array.length - n))
                }, _.rest = _.tail = _.drop = function(array, n, guard) {
                    return slice.call(array, null == n || guard ? 1 : n)
                }, _.compact = function(array) {
                    return _.filter(array, _.identity)
                };
                var flatten = function(input, shallow, strict, startIndex) {
                    for (var output = [], idx = 0, i = startIndex || 0, length = getLength(input); length > i; i++) {
                        var value = input[i];
                        if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                            shallow || (value = flatten(value, shallow, strict));
                            var j = 0,
                                len = value.length;
                            for (output.length += len; len > j;) output[idx++] = value[j++]
                        } else strict || (output[idx++] = value)
                    }
                    return output
                };
                _.flatten = function(array, shallow) {
                    return flatten(array, shallow, !1)
                }, _.without = function(array) {
                    return _.difference(array, slice.call(arguments, 1))
                }, _.uniq = _.unique = function(array, isSorted, iteratee, context) {
                    _.isBoolean(isSorted) || (context = iteratee, iteratee = isSorted, isSorted = !1), null != iteratee && (iteratee = cb(iteratee, context));
                    for (var result = [], seen = [], i = 0, length = getLength(array); length > i; i++) {
                        var value = array[i],
                            computed = iteratee ? iteratee(value, i, array) : value;
                        isSorted ? (i && seen === computed || result.push(value), seen = computed) : iteratee ? _.contains(seen, computed) || (seen.push(computed), result.push(value)) : _.contains(result, value) || result.push(value)
                    }
                    return result
                }, _.union = function() {
                    return _.uniq(flatten(arguments, !0, !0))
                }, _.intersection = function(array) {
                    for (var result = [], argsLength = arguments.length, i = 0, length = getLength(array); length > i; i++) {
                        var item = array[i];
                        if (!_.contains(result, item)) {
                            for (var j = 1; argsLength > j && _.contains(arguments[j], item); j++);
                            j === argsLength && result.push(item)
                        }
                    }
                    return result
                }, _.difference = function(array) {
                    var rest = flatten(arguments, !0, !0, 1);
                    return _.filter(array, function(value) {
                        return !_.contains(rest, value)
                    })
                }, _.zip = function() {
                    return _.unzip(arguments)
                }, _.unzip = function(array) {
                    for (var length = array && _.max(array, getLength).length || 0, result = Array(length), index = 0; length > index; index++) result[index] = _.pluck(array, index);
                    return result
                }, _.object = function(list, values) {
                    for (var result = {}, i = 0, length = getLength(list); length > i; i++) values ? result[list[i]] = values[i] : result[list[i][0]] = list[i][1];
                    return result
                }, _.findIndex = createPredicateIndexFinder(1), _.findLastIndex = createPredicateIndexFinder(-1), _.sortedIndex = function(array, obj, iteratee, context) {
                    iteratee = cb(iteratee, context, 1);
                    for (var value = iteratee(obj), low = 0, high = getLength(array); high > low;) {
                        var mid = Math.floor((low + high) / 2);
                        iteratee(array[mid]) < value ? low = mid + 1 : high = mid
                    }
                    return low
                }, _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex), _.lastIndexOf = createIndexFinder(-1, _.findLastIndex), _.range = function(start, stop, step) {
                    null == stop && (stop = start || 0, start = 0), step = step || 1;
                    for (var length = Math.max(Math.ceil((stop - start) / step), 0), range = Array(length), idx = 0; length > idx; idx++, start += step) range[idx] = start;
                    return range
                };
                var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
                    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
                    var self = baseCreate(sourceFunc.prototype),
                        result = sourceFunc.apply(self, args);
                    return _.isObject(result) ? result : self
                };
                _.bind = function(func, context) {
                    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
                    if (!_.isFunction(func)) throw new TypeError("Bind must be called on a function");
                    var args = slice.call(arguments, 2),
                        bound = function() {
                            return executeBound(func, bound, context, this, args.concat(slice.call(arguments)))
                        };
                    return bound
                }, _.partial = function(func) {
                    var boundArgs = slice.call(arguments, 1),
                        bound = function() {
                            for (var position = 0, length = boundArgs.length, args = Array(length), i = 0; length > i; i++) args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
                            for (; position < arguments.length;) args.push(arguments[position++]);
                            return executeBound(func, bound, this, this, args)
                        };
                    return bound
                }, _.bindAll = function(obj) {
                    var i, key, length = arguments.length;
                    if (1 >= length) throw new Error("bindAll must be passed function names");
                    for (i = 1; length > i; i++) key = arguments[i], obj[key] = _.bind(obj[key], obj);
                    return obj
                }, _.memoize = function(func, hasher) {
                    var memoize = function(key) {
                        var cache = memoize.cache,
                            address = "" + (hasher ? hasher.apply(this, arguments) : key);
                        return _.has(cache, address) || (cache[address] = func.apply(this, arguments)), cache[address]
                    };
                    return memoize.cache = {}, memoize
                }, _.delay = function(func, wait) {
                    var args = slice.call(arguments, 2);
                    return setTimeout(function() {
                        return func.apply(null, args)
                    }, wait)
                }, _.defer = _.partial(_.delay, _, 1), _.throttle = function(func, wait, options) {
                    var context, args, result, timeout = null,
                        previous = 0;
                    options || (options = {});
                    var later = function() {
                        previous = options.leading === !1 ? 0 : _.now(), timeout = null, result = func.apply(context, args), timeout || (context = args = null);
                    };
                    return function() {
                        var now = _.now();
                        previous || options.leading !== !1 || (previous = now);
                        var remaining = wait - (now - previous);
                        return context = this, args = arguments, 0 >= remaining || remaining > wait ? (timeout && (clearTimeout(timeout), timeout = null), previous = now, result = func.apply(context, args), timeout || (context = args = null)) : timeout || options.trailing === !1 || (timeout = setTimeout(later, remaining)), result
                    }
                }, _.debounce = function(func, wait, immediate) {
                    var timeout, args, context, timestamp, result, later = function() {
                        var last = _.now() - timestamp;
                        wait > last && last >= 0 ? timeout = setTimeout(later, wait - last) : (timeout = null, immediate || (result = func.apply(context, args), timeout || (context = args = null)))
                    };
                    return function() {
                        context = this, args = arguments, timestamp = _.now();
                        var callNow = immediate && !timeout;
                        return timeout || (timeout = setTimeout(later, wait)), callNow && (result = func.apply(context, args), context = args = null), result
                    }
                }, _.wrap = function(func, wrapper) {
                    return _.partial(wrapper, func)
                }, _.negate = function(predicate) {
                    return function() {
                        return !predicate.apply(this, arguments)
                    }
                }, _.compose = function() {
                    var args = arguments,
                        start = args.length - 1;
                    return function() {
                        for (var i = start, result = args[start].apply(this, arguments); i--;) result = args[i].call(this, result);
                        return result
                    }
                }, _.after = function(times, func) {
                    return function() {
                        return --times < 1 ? func.apply(this, arguments) : void 0
                    }
                }, _.before = function(times, func) {
                    var memo;
                    return function() {
                        return --times > 0 && (memo = func.apply(this, arguments)), 1 >= times && (func = null), memo
                    }
                }, _.once = _.partial(_.before, 2);
                var hasEnumBug = !{
                        toString: null
                    }.propertyIsEnumerable("toString"),
                    nonEnumerableProps = ["valueOf", "isPrototypeOf", "toString", "propertyIsEnumerable", "hasOwnProperty", "toLocaleString"];
                _.keys = function(obj) {
                    if (!_.isObject(obj)) return [];
                    if (nativeKeys) return nativeKeys(obj);
                    var keys = [];
                    for (var key in obj) _.has(obj, key) && keys.push(key);
                    return hasEnumBug && collectNonEnumProps(obj, keys), keys
                }, _.allKeys = function(obj) {
                    if (!_.isObject(obj)) return [];
                    var keys = [];
                    for (var key in obj) keys.push(key);
                    return hasEnumBug && collectNonEnumProps(obj, keys), keys
                }, _.values = function(obj) {
                    for (var keys = _.keys(obj), length = keys.length, values = Array(length), i = 0; length > i; i++) values[i] = obj[keys[i]];
                    return values
                }, _.mapObject = function(obj, iteratee, context) {
                    iteratee = cb(iteratee, context);
                    for (var currentKey, keys = _.keys(obj), length = keys.length, results = {}, index = 0; length > index; index++) currentKey = keys[index], results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
                    return results
                }, _.pairs = function(obj) {
                    for (var keys = _.keys(obj), length = keys.length, pairs = Array(length), i = 0; length > i; i++) pairs[i] = [keys[i], obj[keys[i]]];
                    return pairs
                }, _.invert = function(obj) {
                    for (var result = {}, keys = _.keys(obj), i = 0, length = keys.length; length > i; i++) result[obj[keys[i]]] = keys[i];
                    return result
                }, _.functions = _.methods = function(obj) {
                    var names = [];
                    for (var key in obj) _.isFunction(obj[key]) && names.push(key);
                    return names.sort()
                }, _.extend = createAssigner(_.allKeys), _.extendOwn = _.assign = createAssigner(_.keys), _.findKey = function(obj, predicate, context) {
                    predicate = cb(predicate, context);
                    for (var key, keys = _.keys(obj), i = 0, length = keys.length; length > i; i++)
                        if (key = keys[i], predicate(obj[key], key, obj)) return key
                }, _.pick = function(object, oiteratee, context) {
                    var iteratee, keys, result = {},
                        obj = object;
                    if (null == obj) return result;
                    _.isFunction(oiteratee) ? (keys = _.allKeys(obj), iteratee = optimizeCb(oiteratee, context)) : (keys = flatten(arguments, !1, !1, 1), iteratee = function(value, key, obj) {
                        return key in obj
                    }, obj = Object(obj));
                    for (var i = 0, length = keys.length; length > i; i++) {
                        var key = keys[i],
                            value = obj[key];
                        iteratee(value, key, obj) && (result[key] = value)
                    }
                    return result
                }, _.omit = function(obj, iteratee, context) {
                    if (_.isFunction(iteratee)) iteratee = _.negate(iteratee);
                    else {
                        var keys = _.map(flatten(arguments, !1, !1, 1), String);
                        iteratee = function(value, key) {
                            return !_.contains(keys, key)
                        }
                    }
                    return _.pick(obj, iteratee, context)
                }, _.defaults = createAssigner(_.allKeys, !0), _.create = function(prototype, props) {
                    var result = baseCreate(prototype);
                    return props && _.extendOwn(result, props), result
                }, _.clone = function(obj) {
                    return _.isObject(obj) ? _.isArray(obj) ? obj.slice() : _.extend({}, obj) : obj
                }, _.tap = function(obj, interceptor) {
                    return interceptor(obj), obj
                }, _.isMatch = function(object, attrs) {
                    var keys = _.keys(attrs),
                        length = keys.length;
                    if (null == object) return !length;
                    for (var obj = Object(object), i = 0; length > i; i++) {
                        var key = keys[i];
                        if (attrs[key] !== obj[key] || !(key in obj)) return !1
                    }
                    return !0
                };
                var eq = function(a, b, aStack, bStack) {
                    if (a === b) return 0 !== a || 1 / a === 1 / b;
                    if (null == a || null == b) return a === b;
                    a instanceof _ && (a = a._wrapped), b instanceof _ && (b = b._wrapped);
                    var className = toString.call(a);
                    if (className !== toString.call(b)) return !1;
                    switch (className) {
                        case "[object RegExp]":
                        case "[object String]":
                            return "" + a == "" + b;
                        case "[object Number]":
                            return +a !== +a ? +b !== +b : 0 === +a ? 1 / +a === 1 / b : +a === +b;
                        case "[object Date]":
                        case "[object Boolean]":
                            return +a === +b
                    }
                    var areArrays = "[object Array]" === className;
                    if (!areArrays) {
                        if ("object" != typeof a || "object" != typeof b) return !1;
                        var aCtor = a.constructor,
                            bCtor = b.constructor;
                        if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && "constructor" in a && "constructor" in b) return !1
                    }
                    aStack = aStack || [], bStack = bStack || [];
                    for (var length = aStack.length; length--;)
                        if (aStack[length] === a) return bStack[length] === b;
                    if (aStack.push(a), bStack.push(b), areArrays) {
                        if (length = a.length, length !== b.length) return !1;
                        for (; length--;)
                            if (!eq(a[length], b[length], aStack, bStack)) return !1
                    } else {
                        var key, keys = _.keys(a);
                        if (length = keys.length, _.keys(b).length !== length) return !1;
                        for (; length--;)
                            if (key = keys[length], !_.has(b, key) || !eq(a[key], b[key], aStack, bStack)) return !1
                    }
                    return aStack.pop(), bStack.pop(), !0
                };
                _.isEqual = function(a, b) {
                    return eq(a, b)
                }, _.isEmpty = function(obj) {
                    return null == obj ? !0 : isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) ? 0 === obj.length : 0 === _.keys(obj).length
                }, _.isElement = function(obj) {
                    return !(!obj || 1 !== obj.nodeType)
                }, _.isArray = nativeIsArray || function(obj) {
                    return "[object Array]" === toString.call(obj)
                }, _.isObject = function(obj) {
                    var type = typeof obj;
                    return "function" === type || "object" === type && !!obj
                }, _.each(["Arguments", "Function", "String", "Number", "Date", "RegExp", "Error"], function(name) {
                    _["is" + name] = function(obj) {
                        return toString.call(obj) === "[object " + name + "]"
                    }
                }), _.isArguments(arguments) || (_.isArguments = function(obj) {
                    return _.has(obj, "callee")
                }), "function" != typeof /./ && "object" != typeof Int8Array && (_.isFunction = function(obj) {
                    return "function" == typeof obj || !1
                }), _.isFinite = function(obj) {
                    return isFinite(obj) && !isNaN(parseFloat(obj))
                }, _.isNaN = function(obj) {
                    return _.isNumber(obj) && obj !== +obj
                }, _.isBoolean = function(obj) {
                    return obj === !0 || obj === !1 || "[object Boolean]" === toString.call(obj)
                }, _.isNull = function(obj) {
                    return null === obj
                }, _.isUndefined = function(obj) {
                    return void 0 === obj
                }, _.has = function(obj, key) {
                    return null != obj && hasOwnProperty.call(obj, key)
                }, _.noConflict = function() {
                    return root._ = previousUnderscore, this
                }, _.identity = function(value) {
                    return value
                }, _.constant = function(value) {
                    return function() {
                        return value
                    }
                }, _.noop = function() {}, _.property = property, _.propertyOf = function(obj) {
                    return null == obj ? function() {} : function(key) {
                        return obj[key]
                    }
                }, _.matcher = _.matches = function(attrs) {
                    return attrs = _.extendOwn({}, attrs),
                        function(obj) {
                            return _.isMatch(obj, attrs)
                        }
                }, _.times = function(n, iteratee, context) {
                    var accum = Array(Math.max(0, n));
                    iteratee = optimizeCb(iteratee, context, 1);
                    for (var i = 0; n > i; i++) accum[i] = iteratee(i);
                    return accum
                }, _.random = function(min, max) {
                    return null == max && (max = min, min = 0), min + Math.floor(Math.random() * (max - min + 1))
                }, _.now = Date.now || function() {
                    return (new Date).getTime()
                };
                var escapeMap = {
                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#x27;",
                        "`": "&#x60;"
                    },
                    unescapeMap = _.invert(escapeMap),
                    createEscaper = function(map) {
                        var escaper = function(match) {
                                return map[match]
                            },
                            source = "(?:" + _.keys(map).join("|") + ")",
                            testRegexp = RegExp(source),
                            replaceRegexp = RegExp(source, "g");
                        return function(string) {
                            return string = null == string ? "" : "" + string, testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string
                        }
                    };
                _.escape = createEscaper(escapeMap), _.unescape = createEscaper(unescapeMap), _.result = function(object, property, fallback) {
                    var value = null == object ? void 0 : object[property];
                    return void 0 === value && (value = fallback), _.isFunction(value) ? value.call(object) : value
                };
                var idCounter = 0;
                _.uniqueId = function(prefix) {
                    var id = ++idCounter + "";
                    return prefix ? prefix + id : id
                }, _.templateSettings = {
                    evaluate: /<%([\s\S]+?)%>/g,
                    interpolate: /<%=([\s\S]+?)%>/g,
                    escape: /<%-([\s\S]+?)%>/g
                };
                var noMatch = /(.)^/,
                    escapes = {
                        "'": "'",
                        "\\": "\\",
                        "\r": "r",
                        "\n": "n",
                        "\u2028": "u2028",
                        "\u2029": "u2029"
                    },
                    escaper = /\\|'|\r|\n|\u2028|\u2029/g,
                    escapeChar = function(match) {
                        return "\\" + escapes[match]
                    };
                _.template = function(text, settings, oldSettings) {
                    !settings && oldSettings && (settings = oldSettings), settings = _.defaults({}, settings, _.templateSettings);
                    var matcher = RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join("|") + "|$", "g"),
                        index = 0,
                        source = "__p+='";
                    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
                        return source += text.slice(index, offset).replace(escaper, escapeChar), index = offset + match.length, escape ? source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'" : interpolate ? source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" : evaluate && (source += "';\n" + evaluate + "\n__p+='"), match
                    }), source += "';\n", settings.variable || (source = "with(obj||{}){\n" + source + "}\n"), source = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
                    try {
                        var render = new Function(settings.variable || "obj", "_", source)
                    } catch (e) {
                        throw e.source = source, e
                    }
                    var template = function(data) {
                            return render.call(this, data, _)
                        },
                        argument = settings.variable || "obj";
                    return template.source = "function(" + argument + "){\n" + source + "}", template
                }, _.chain = function(obj) {
                    var instance = _(obj);
                    return instance._chain = !0, instance
                };
                var result = function(instance, obj) {
                    return instance._chain ? _(obj).chain() : obj
                };
                _.mixin = function(obj) {
                    _.each(_.functions(obj), function(name) {
                        var func = _[name] = obj[name];
                        _.prototype[name] = function() {
                            var args = [this._wrapped];
                            return push.apply(args, arguments), result(this, func.apply(_, args))
                        }
                    })
                }, _.mixin(_), _.each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
                    var method = ArrayProto[name];
                    _.prototype[name] = function() {
                        var obj = this._wrapped;
                        return method.apply(obj, arguments), "shift" !== name && "splice" !== name || 0 !== obj.length || delete obj[0], result(this, obj)
                    }
                }), _.each(["concat", "join", "slice"], function(name) {
                    var method = ArrayProto[name];
                    _.prototype[name] = function() {
                        return result(this, method.apply(this._wrapped, arguments))
                    }
                }), _.prototype.value = function() {
                    return this._wrapped
                }, _.prototype.valueOf = _.prototype.toJSON = _.prototype.value, _.prototype.toString = function() {
                    return "" + this._wrapped
                }, "function" == typeof define && define.amd && define("underscore", [], function() {
                    return _
                })
            }).call(this)
        }, {}],
        154: [function(require, module, exports) {
            (function(global) {
                function deprecate(fn, msg) {
                    function deprecated() {
                        if (!warned) {
                            if (config("throwDeprecation")) throw new Error(msg);
                            config("traceDeprecation") ? console.trace(msg) : console.warn(msg), warned = !0
                        }
                        return fn.apply(this, arguments)
                    }
                    if (config("noDeprecation")) return fn;
                    var warned = !1;
                    return deprecated
                }

                function config(name) {
                    try {
                        if (!global.localStorage) return !1
                    } catch (_) {
                        return !1
                    }
                    var val = global.localStorage[name];
                    return null == val ? !1 : "true" === String(val).toLowerCase()
                }
                module.exports = deprecate
            }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {}],
        155: [function(require, module, exports) {
            arguments[4][81][0].apply(exports, arguments)
        }, {
            dup: 81
        }],
        156: [function(require, module, exports) {
            module.exports = function(arg) {
                return arg && "object" == typeof arg && "function" == typeof arg.copy && "function" == typeof arg.fill && "function" == typeof arg.readUInt8
            }
        }, {}],
        157: [function(require, module, exports) {
            (function(process, global) {
                function inspect(obj, opts) {
                    var ctx = {
                        seen: [],
                        stylize: stylizeNoColor
                    };
                    return arguments.length >= 3 && (ctx.depth = arguments[2]), arguments.length >= 4 && (ctx.colors = arguments[3]), isBoolean(opts) ? ctx.showHidden = opts : opts && exports._extend(ctx, opts), isUndefined(ctx.showHidden) && (ctx.showHidden = !1), isUndefined(ctx.depth) && (ctx.depth = 2), isUndefined(ctx.colors) && (ctx.colors = !1), isUndefined(ctx.customInspect) && (ctx.customInspect = !0), ctx.colors && (ctx.stylize = stylizeWithColor), formatValue(ctx, obj, ctx.depth)
                }

                function stylizeWithColor(str, styleType) {
                    var style = inspect.styles[styleType];
                    return style ? "[" + inspect.colors[style][0] + "m" + str + "[" + inspect.colors[style][1] + "m" : str
                }

                function stylizeNoColor(str, styleType) {
                    return str
                }

                function arrayToHash(array) {
                    var hash = {};
                    return array.forEach(function(val, idx) {
                        hash[val] = !0
                    }), hash
                }

                function formatValue(ctx, value, recurseTimes) {
                    if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== exports.inspect && (!value.constructor || value.constructor.prototype !== value)) {
                        var ret = value.inspect(recurseTimes, ctx);
                        return isString(ret) || (ret = formatValue(ctx, ret, recurseTimes)), ret
                    }
                    var primitive = formatPrimitive(ctx, value);
                    if (primitive) return primitive;
                    var keys = Object.keys(value),
                        visibleKeys = arrayToHash(keys);
                    if (ctx.showHidden && (keys = Object.getOwnPropertyNames(value)), isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) return formatError(value);
                    if (0 === keys.length) {
                        if (isFunction(value)) {
                            var name = value.name ? ": " + value.name : "";
                            return ctx.stylize("[Function" + name + "]", "special")
                        }
                        if (isRegExp(value)) return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
                        if (isDate(value)) return ctx.stylize(Date.prototype.toString.call(value), "date");
                        if (isError(value)) return formatError(value)
                    }
                    var base = "",
                        array = !1,
                        braces = ["{", "}"];
                    if (isArray(value) && (array = !0, braces = ["[", "]"]), isFunction(value)) {
                        var n = value.name ? ": " + value.name : "";
                        base = " [Function" + n + "]"
                    }
                    if (isRegExp(value) && (base = " " + RegExp.prototype.toString.call(value)), isDate(value) && (base = " " + Date.prototype.toUTCString.call(value)), isError(value) && (base = " " + formatError(value)), 0 === keys.length && (!array || 0 == value.length)) return braces[0] + base + braces[1];
                    if (0 > recurseTimes) return isRegExp(value) ? ctx.stylize(RegExp.prototype.toString.call(value), "regexp") : ctx.stylize("[Object]", "special");
                    ctx.seen.push(value);
                    var output;
                    return output = array ? formatArray(ctx, value, recurseTimes, visibleKeys, keys) : keys.map(function(key) {
                        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array)
                    }), ctx.seen.pop(), reduceToSingleString(output, base, braces)
                }

                function formatPrimitive(ctx, value) {
                    if (isUndefined(value)) return ctx.stylize("undefined", "undefined");
                    if (isString(value)) {
                        var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                        return ctx.stylize(simple, "string")
                    }
                    return isNumber(value) ? ctx.stylize("" + value, "number") : isBoolean(value) ? ctx.stylize("" + value, "boolean") : isNull(value) ? ctx.stylize("null", "null") : void 0
                }

                function formatError(value) {
                    return "[" + Error.prototype.toString.call(value) + "]"
                }

                function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
                    for (var output = [], i = 0, l = value.length; l > i; ++i) hasOwnProperty(value, String(i)) ? output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), !0)) : output.push("");
                    return keys.forEach(function(key) {
                        key.match(/^\d+$/) || output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, !0))
                    }), output
                }

                function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
                    var name, str, desc;
                    if (desc = Object.getOwnPropertyDescriptor(value, key) || {
                            value: value[key]
                        }, desc.get ? str = desc.set ? ctx.stylize("[Getter/Setter]", "special") : ctx.stylize("[Getter]", "special") : desc.set && (str = ctx.stylize("[Setter]", "special")), hasOwnProperty(visibleKeys, key) || (name = "[" + key + "]"), str || (ctx.seen.indexOf(desc.value) < 0 ? (str = isNull(recurseTimes) ? formatValue(ctx, desc.value, null) : formatValue(ctx, desc.value, recurseTimes - 1), str.indexOf("\n") > -1 && (str = array ? str.split("\n").map(function(line) {
                            return "  " + line
                        }).join("\n").substr(2) : "\n" + str.split("\n").map(function(line) {
                            return "   " + line
                        }).join("\n"))) : str = ctx.stylize("[Circular]", "special")), isUndefined(name)) {
                        if (array && key.match(/^\d+$/)) return str;
                        name = JSON.stringify("" + key), name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (name = name.substr(1, name.length - 2), name = ctx.stylize(name, "name")) : (name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), name = ctx.stylize(name, "string"))
                    }
                    return name + ": " + str
                }

                function reduceToSingleString(output, base, braces) {
                    var numLinesEst = 0,
                        length = output.reduce(function(prev, cur) {
                            return numLinesEst++, cur.indexOf("\n") >= 0 && numLinesEst++, prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1
                        }, 0);
                    return length > 60 ? braces[0] + ("" === base ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1] : braces[0] + base + " " + output.join(", ") + " " + braces[1]
                }

                function isArray(ar) {
                    return Array.isArray(ar)
                }

                function isBoolean(arg) {
                    return "boolean" == typeof arg
                }

                function isNull(arg) {
                    return null === arg
                }

                function isNullOrUndefined(arg) {
                    return null == arg
                }

                function isNumber(arg) {
                    return "number" == typeof arg
                }

                function isString(arg) {
                    return "string" == typeof arg
                }

                function isSymbol(arg) {
                    return "symbol" == typeof arg
                }

                function isUndefined(arg) {
                    return void 0 === arg
                }

                function isRegExp(re) {
                    return isObject(re) && "[object RegExp]" === objectToString(re)
                }

                function isObject(arg) {
                    return "object" == typeof arg && null !== arg
                }

                function isDate(d) {
                    return isObject(d) && "[object Date]" === objectToString(d)
                }

                function isError(e) {
                    return isObject(e) && ("[object Error]" === objectToString(e) || e instanceof Error)
                }

                function isFunction(arg) {
                    return "function" == typeof arg
                }

                function isPrimitive(arg) {
                    return null === arg || "boolean" == typeof arg || "number" == typeof arg || "string" == typeof arg || "symbol" == typeof arg || "undefined" == typeof arg
                }

                function objectToString(o) {
                    return Object.prototype.toString.call(o)
                }

                function pad(n) {
                    return 10 > n ? "0" + n.toString(10) : n.toString(10)
                }

                function timestamp() {
                    var d = new Date,
                        time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(":");
                    return [d.getDate(), months[d.getMonth()], time].join(" ")
                }

                function hasOwnProperty(obj, prop) {
                    return Object.prototype.hasOwnProperty.call(obj, prop)
                }
                var formatRegExp = /%[sdj%]/g;
                exports.format = function(f) {
                    if (!isString(f)) {
                        for (var objects = [], i = 0; i < arguments.length; i++) objects.push(inspect(arguments[i]));
                        return objects.join(" ")
                    }
                    for (var i = 1, args = arguments, len = args.length, str = String(f).replace(formatRegExp, function(x) {
                            if ("%%" === x) return "%";
                            if (i >= len) return x;
                            switch (x) {
                                case "%s":
                                    return String(args[i++]);
                                case "%d":
                                    return Number(args[i++]);
                                case "%j":
                                    try {
                                        return JSON.stringify(args[i++])
                                    } catch (_) {
                                        return "[Circular]"
                                    }
                                    default:
                                        return x
                            }
                        }), x = args[i]; len > i; x = args[++i]) str += isNull(x) || !isObject(x) ? " " + x : " " + inspect(x);
                    return str
                }, exports.deprecate = function(fn, msg) {
                    function deprecated() {
                        if (!warned) {
                            if (process.throwDeprecation) throw new Error(msg);
                            process.traceDeprecation ? console.trace(msg) : console.error(msg), warned = !0
                        }
                        return fn.apply(this, arguments)
                    }
                    if (isUndefined(global.process)) return function() {
                        return exports.deprecate(fn, msg).apply(this, arguments)
                    };
                    if (process.noDeprecation === !0) return fn;
                    var warned = !1;
                    return deprecated
                };
                var debugEnviron, debugs = {};
                exports.debuglog = function(set) {
                    if (isUndefined(debugEnviron) && (debugEnviron = process.env.NODE_DEBUG || ""), set = set.toUpperCase(), !debugs[set])
                        if (new RegExp("\\b" + set + "\\b", "i").test(debugEnviron)) {
                            var pid = process.pid;
                            debugs[set] = function() {
                                var msg = exports.format.apply(exports, arguments);
                                console.error("%s %d: %s", set, pid, msg)
                            }
                        } else debugs[set] = function() {};
                    return debugs[set]
                }, exports.inspect = inspect, inspect.colors = {
                    bold: [1, 22],
                    italic: [3, 23],
                    underline: [4, 24],
                    inverse: [7, 27],
                    white: [37, 39],
                    grey: [90, 39],
                    black: [30, 39],
                    blue: [34, 39],
                    cyan: [36, 39],
                    green: [32, 39],
                    magenta: [35, 39],
                    red: [31, 39],
                    yellow: [33, 39]
                }, inspect.styles = {
                    special: "cyan",
                    number: "yellow",
                    "boolean": "yellow",
                    undefined: "grey",
                    "null": "bold",
                    string: "green",
                    date: "magenta",
                    regexp: "red"
                }, exports.isArray = isArray, exports.isBoolean = isBoolean, exports.isNull = isNull, exports.isNullOrUndefined = isNullOrUndefined, exports.isNumber = isNumber, exports.isString = isString, exports.isSymbol = isSymbol, exports.isUndefined = isUndefined, exports.isRegExp = isRegExp, exports.isObject = isObject, exports.isDate = isDate, exports.isError = isError, exports.isFunction = isFunction, exports.isPrimitive = isPrimitive, exports.isBuffer = require("./support/isBuffer");
                var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                exports.log = function() {
                    console.log("%s - %s", timestamp(), exports.format.apply(exports, arguments))
                }, exports.inherits = require("inherits"), exports._extend = function(origin, add) {
                    if (!add || !isObject(add)) return origin;
                    for (var keys = Object.keys(add), i = keys.length; i--;) origin[keys[i]] = add[keys[i]];
                    return origin
                }
            }).call(this, require("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
        }, {
            "./support/isBuffer": 156,
            _process: 138,
            inherits: 155
        }],
        158: [function(require, module, exports) {
            (function() {
                var assign, getValue, isArray, isEmpty, isFunction, isObject, isPlainObject, slice = [].slice,
                    hasProp = {}.hasOwnProperty;
                assign = function() {
                    var i, key, len, source, sources, target;
                    if (target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [], isFunction(Object.assign)) Object.assign.apply(null, arguments);
                    else
                        for (i = 0, len = sources.length; len > i; i++)
                            if (source = sources[i], null != source)
                                for (key in source) hasProp.call(source, key) && (target[key] = source[key]);
                    return target
                }, isFunction = function(val) {
                    return !!val && "[object Function]" === Object.prototype.toString.call(val)
                }, isObject = function(val) {
                    var ref;
                    return !!val && ("function" == (ref = typeof val) || "object" === ref)
                }, isArray = function(val) {
                    return isFunction(Array.isArray) ? Array.isArray(val) : "[object Array]" === Object.prototype.toString.call(val)
                }, isEmpty = function(val) {
                    var key;
                    if (isArray(val)) return !val.length;
                    for (key in val)
                        if (hasProp.call(val, key)) return !1;
                    return !0
                }, isPlainObject = function(val) {
                    var ctor, proto;
                    return isObject(val) && (proto = Object.getPrototypeOf(val)) && (ctor = proto.constructor) && "function" == typeof ctor && ctor instanceof ctor && Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object)
                }, getValue = function(obj) {
                    return isFunction(obj.valueOf) ? obj.valueOf() : obj
                }, module.exports.assign = assign, module.exports.isFunction = isFunction, module.exports.isObject = isObject, module.exports.isArray = isArray, module.exports.isEmpty = isEmpty, module.exports.isPlainObject = isPlainObject, module.exports.getValue = getValue
            }).call(this)
        }, {}],
        159: [function(require, module, exports) {
            (function() {
                var XMLAttribute;
                module.exports = XMLAttribute = function() {
                    function XMLAttribute(parent, name, value) {
                        if (this.options = parent.options, this.stringify = parent.stringify, this.parent = parent, null == name) throw new Error("Missing attribute name. " + this.debugInfo(name));
                        if (null == value) throw new Error("Missing attribute value. " + this.debugInfo(name));
                        this.name = this.stringify.attName(name), this.value = this.stringify.attValue(value)
                    }
                    return XMLAttribute.prototype.clone = function() {
                        return Object.create(this)
                    }, XMLAttribute.prototype.toString = function(options) {
                        return this.options.writer.set(options).attribute(this)
                    }, XMLAttribute.prototype.debugInfo = function(name) {
                        var ref, ref1;
                        return name = name || this.name, null != name || (null != (ref = this.parent) ? ref.name : void 0) ? null == name ? "parent: <" + this.parent.name + ">" : (null != (ref1 = this.parent) ? ref1.name : void 0) ? "attribute: {" + name + "}, parent: <" + this.parent.name + ">" : "attribute: {" + name + "}" : ""
                    }, XMLAttribute
                }()
            }).call(this)
        }, {}],
        160: [function(require, module, exports) {
            (function() {
                var XMLCData, XMLNode, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLNode = require("./XMLNode"), module.exports = XMLCData = function(superClass) {
                    function XMLCData(parent, text) {
                        if (XMLCData.__super__.constructor.call(this, parent), null == text) throw new Error("Missing CDATA text. " + this.debugInfo());
                        this.text = this.stringify.cdata(text)
                    }
                    return extend(XMLCData, superClass), XMLCData.prototype.clone = function() {
                        return Object.create(this)
                    }, XMLCData.prototype.toString = function(options) {
                        return this.options.writer.set(options).cdata(this)
                    }, XMLCData
                }(XMLNode)
            }).call(this)
        }, {
            "./XMLNode": 171
        }],
        161: [function(require, module, exports) {
            (function() {
                var XMLComment, XMLNode, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLNode = require("./XMLNode"), module.exports = XMLComment = function(superClass) {
                    function XMLComment(parent, text) {
                        if (XMLComment.__super__.constructor.call(this, parent), null == text) throw new Error("Missing comment text. " + this.debugInfo());
                        this.text = this.stringify.comment(text)
                    }
                    return extend(XMLComment, superClass), XMLComment.prototype.clone = function() {
                        return Object.create(this)
                    }, XMLComment.prototype.toString = function(options) {
                        return this.options.writer.set(options).comment(this)
                    }, XMLComment
                }(XMLNode)
            }).call(this)
        }, {
            "./XMLNode": 171
        }],
        162: [function(require, module, exports) {
            (function() {
                var XMLDTDAttList, XMLNode, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLNode = require("./XMLNode"), module.exports = XMLDTDAttList = function(superClass) {
                    function XMLDTDAttList(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                        if (XMLDTDAttList.__super__.constructor.call(this, parent), null == elementName) throw new Error("Missing DTD element name. " + this.debugInfo());
                        if (null == attributeName) throw new Error("Missing DTD attribute name. " + this.debugInfo(elementName));
                        if (!attributeType) throw new Error("Missing DTD attribute type. " + this.debugInfo(elementName));
                        if (!defaultValueType) throw new Error("Missing DTD attribute default. " + this.debugInfo(elementName));
                        if (0 !== defaultValueType.indexOf("#") && (defaultValueType = "#" + defaultValueType), !defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(elementName));
                        if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(elementName));
                        this.elementName = this.stringify.eleName(elementName), this.attributeName = this.stringify.attName(attributeName), this.attributeType = this.stringify.dtdAttType(attributeType), this.defaultValue = this.stringify.dtdAttDefault(defaultValue), this.defaultValueType = defaultValueType
                    }
                    return extend(XMLDTDAttList, superClass), XMLDTDAttList.prototype.toString = function(options) {
                        return this.options.writer.set(options).dtdAttList(this)
                    }, XMLDTDAttList
                }(XMLNode)
            }).call(this)
        }, {
            "./XMLNode": 171
        }],
        163: [function(require, module, exports) {
            (function() {
                var XMLDTDElement, XMLNode, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLNode = require("./XMLNode"), module.exports = XMLDTDElement = function(superClass) {
                    function XMLDTDElement(parent, name, value) {
                        if (XMLDTDElement.__super__.constructor.call(this, parent), null == name) throw new Error("Missing DTD element name. " + this.debugInfo());
                        value || (value = "(#PCDATA)"), Array.isArray(value) && (value = "(" + value.join(",") + ")"), this.name = this.stringify.eleName(name), this.value = this.stringify.dtdElementValue(value)
                    }
                    return extend(XMLDTDElement, superClass), XMLDTDElement.prototype.toString = function(options) {
                        return this.options.writer.set(options).dtdElement(this)
                    }, XMLDTDElement
                }(XMLNode)
            }).call(this)
        }, {
            "./XMLNode": 171
        }],
        164: [function(require, module, exports) {
            (function() {
                var XMLDTDEntity, XMLNode, isObject, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                isObject = require("./Utility").isObject, XMLNode = require("./XMLNode"), module.exports = XMLDTDEntity = function(superClass) {
                    function XMLDTDEntity(parent, pe, name, value) {
                        if (XMLDTDEntity.__super__.constructor.call(this, parent), null == name) throw new Error("Missing DTD entity name. " + this.debugInfo(name));
                        if (null == value) throw new Error("Missing DTD entity value. " + this.debugInfo(name));
                        if (this.pe = !!pe, this.name = this.stringify.eleName(name), isObject(value)) {
                            if (!value.pubID && !value.sysID) throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(name));
                            if (value.pubID && !value.sysID) throw new Error("System identifier is required for a public external entity. " + this.debugInfo(name));
                            if (null != value.pubID && (this.pubID = this.stringify.dtdPubID(value.pubID)), null != value.sysID && (this.sysID = this.stringify.dtdSysID(value.sysID)), null != value.nData && (this.nData = this.stringify.dtdNData(value.nData)), this.pe && this.nData) throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(name))
                        } else this.value = this.stringify.dtdEntityValue(value)
                    }
                    return extend(XMLDTDEntity, superClass), XMLDTDEntity.prototype.toString = function(options) {
                        return this.options.writer.set(options).dtdEntity(this)
                    }, XMLDTDEntity
                }(XMLNode)
            }).call(this)
        }, {
            "./Utility": 158,
            "./XMLNode": 171
        }],
        165: [function(require, module, exports) {
            (function() {
                var XMLDTDNotation, XMLNode, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLNode = require("./XMLNode"), module.exports = XMLDTDNotation = function(superClass) {
                    function XMLDTDNotation(parent, name, value) {
                        if (XMLDTDNotation.__super__.constructor.call(this, parent), null == name) throw new Error("Missing DTD notation name. " + this.debugInfo(name));
                        if (!value.pubID && !value.sysID) throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(name));
                        this.name = this.stringify.eleName(name), null != value.pubID && (this.pubID = this.stringify.dtdPubID(value.pubID)), null != value.sysID && (this.sysID = this.stringify.dtdSysID(value.sysID))
                    }
                    return extend(XMLDTDNotation, superClass), XMLDTDNotation.prototype.toString = function(options) {
                        return this.options.writer.set(options).dtdNotation(this)
                    }, XMLDTDNotation
                }(XMLNode)
            }).call(this)
        }, {
            "./XMLNode": 171
        }],
        166: [function(require, module, exports) {
            (function() {
                var XMLDeclaration, XMLNode, isObject, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                isObject = require("./Utility").isObject, XMLNode = require("./XMLNode"), module.exports = XMLDeclaration = function(superClass) {
                    function XMLDeclaration(parent, version, encoding, standalone) {
                        var ref;
                        XMLDeclaration.__super__.constructor.call(this, parent), isObject(version) && (ref = version, version = ref.version, encoding = ref.encoding, standalone = ref.standalone), version || (version = "1.0"), this.version = this.stringify.xmlVersion(version), null != encoding && (this.encoding = this.stringify.xmlEncoding(encoding)), null != standalone && (this.standalone = this.stringify.xmlStandalone(standalone))
                    }
                    return extend(XMLDeclaration, superClass), XMLDeclaration.prototype.toString = function(options) {
                        return this.options.writer.set(options).declaration(this)
                    }, XMLDeclaration
                }(XMLNode)
            }).call(this)
        }, {
            "./Utility": 158,
            "./XMLNode": 171
        }],
        167: [function(require, module, exports) {
            (function() {
                var XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDocType, XMLNode, isObject, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype,
                            child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                isObject = require("./Utility").isObject, XMLNode = require("./XMLNode"), XMLDTDAttList = require("./XMLDTDAttList"), XMLDTDEntity = require("./XMLDTDEntity"), XMLDTDElement = require("./XMLDTDElement"), XMLDTDNotation = require("./XMLDTDNotation"), module.exports = XMLDocType = function(superClass) {
                    function XMLDocType(parent, pubID, sysID) {
                        var ref, ref1;
                        XMLDocType.__super__.constructor.call(this, parent), this.name = "!DOCTYPE", this.documentObject = parent, isObject(pubID) && (ref = pubID, pubID = ref.pubID, sysID = ref.sysID), null == sysID && (ref1 = [pubID, sysID], sysID = ref1[0], pubID = ref1[1]), null != pubID && (this.pubID = this.stringify.dtdPubID(pubID)), null != sysID && (this.sysID = this.stringify.dtdSysID(sysID))
                    }
                    return extend(XMLDocType, superClass), XMLDocType.prototype.element = function(name, value) {
                        var child;
                        return child = new XMLDTDElement(this, name, value), this.children.push(child), this
                    }, XMLDocType.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                        var child;
                        return child = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue), this.children.push(child), this
                    }, XMLDocType.prototype.entity = function(name, value) {
                        var child;
                        return child = new XMLDTDEntity(this, !1, name, value), this.children.push(child), this
                    }, XMLDocType.prototype.pEntity = function(name, value) {
                        var child;
                        return child = new XMLDTDEntity(this, !0, name, value), this.children.push(child), this
                    }, XMLDocType.prototype.notation = function(name, value) {
                        var child;
                        return child = new XMLDTDNotation(this, name, value), this.children.push(child), this
                    }, XMLDocType.prototype.toString = function(options) {
                        return this.options.writer.set(options).docType(this)
                    }, XMLDocType.prototype.ele = function(name, value) {
                        return this.element(name, value)
                    }, XMLDocType.prototype.att = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                        return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue)
                    }, XMLDocType.prototype.ent = function(name, value) {
                        return this.entity(name, value)
                    }, XMLDocType.prototype.pent = function(name, value) {
                        return this.pEntity(name, value)
                    }, XMLDocType.prototype.not = function(name, value) {
                        return this.notation(name, value)
                    }, XMLDocType.prototype.up = function() {
                        return this.root() || this.documentObject
                    }, XMLDocType
                }(XMLNode)
            }).call(this)
        }, {
            "./Utility": 158,
            "./XMLDTDAttList": 162,
            "./XMLDTDElement": 163,
            "./XMLDTDEntity": 164,
            "./XMLDTDNotation": 165,
            "./XMLNode": 171
        }],
        168: [function(require, module, exports) {
            (function() {
                var XMLDocument, XMLNode, XMLStringWriter, XMLStringifier, isPlainObject, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                isPlainObject = require("./Utility").isPlainObject, XMLNode = require("./XMLNode"), XMLStringifier = require("./XMLStringifier"), XMLStringWriter = require("./XMLStringWriter"), module.exports = XMLDocument = function(superClass) {
                    function XMLDocument(options) {
                        XMLDocument.__super__.constructor.call(this, null), this.name = "?xml", options || (options = {}), options.writer || (options.writer = new XMLStringWriter), this.options = options, this.stringify = new XMLStringifier(options), this.isDocument = !0
                    }
                    return extend(XMLDocument, superClass), XMLDocument.prototype.end = function(writer) {
                        var writerOptions;
                        return writer ? isPlainObject(writer) && (writerOptions = writer, writer = this.options.writer.set(writerOptions)) : writer = this.options.writer, writer.document(this)
                    }, XMLDocument.prototype.toString = function(options) {
                        return this.options.writer.set(options).document(this)
                    }, XMLDocument
                }(XMLNode)
            }).call(this)
        }, {
            "./Utility": 158,
            "./XMLNode": 171,
            "./XMLStringWriter": 175,
            "./XMLStringifier": 176
        }],
        169: [function(require, module, exports) {
            (function() {
                var XMLAttribute, XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLDocumentCB, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLStringifier, XMLText, getValue, isFunction, isObject, isPlainObject, ref, hasProp = {}.hasOwnProperty;
                ref = require("./Utility"), isObject = ref.isObject, isFunction = ref.isFunction, isPlainObject = ref.isPlainObject, getValue = ref.getValue, XMLElement = require("./XMLElement"), XMLCData = require("./XMLCData"), XMLComment = require("./XMLComment"), XMLRaw = require("./XMLRaw"), XMLText = require("./XMLText"), XMLProcessingInstruction = require("./XMLProcessingInstruction"), XMLDeclaration = require("./XMLDeclaration"), XMLDocType = require("./XMLDocType"), XMLDTDAttList = require("./XMLDTDAttList"), XMLDTDEntity = require("./XMLDTDEntity"), XMLDTDElement = require("./XMLDTDElement"), XMLDTDNotation = require("./XMLDTDNotation"), XMLAttribute = require("./XMLAttribute"), XMLStringifier = require("./XMLStringifier"), XMLStringWriter = require("./XMLStringWriter"), module.exports = XMLDocumentCB = function() {
                    function XMLDocumentCB(options, onData, onEnd) {
                        var writerOptions;
                        this.name = "?xml", options || (options = {}), options.writer ? isPlainObject(options.writer) && (writerOptions = options.writer, options.writer = new XMLStringWriter(writerOptions)) : options.writer = new XMLStringWriter(options), this.options = options, this.writer = options.writer, this.stringify = new XMLStringifier(options), this.onDataCallback = onData || function() {}, this.onEndCallback = onEnd || function() {}, this.currentNode = null, this.currentLevel = -1, this.openTags = {}, this.documentStarted = !1, this.documentCompleted = !1, this.root = null
                    }
                    return XMLDocumentCB.prototype.node = function(name, attributes, text) {
                        var ref1;
                        if (null == name) throw new Error("Missing node name.");
                        if (this.root && -1 === this.currentLevel) throw new Error("Document can only have one root node. " + this.debugInfo(name));
                        return this.openCurrent(), name = getValue(name), null == attributes && (attributes = {}), attributes = getValue(attributes), isObject(attributes) || (ref1 = [attributes, text], text = ref1[0], attributes = ref1[1]), this.currentNode = new XMLElement(this, name, attributes), this.currentNode.children = !1, this.currentLevel++, this.openTags[this.currentLevel] = this.currentNode, null != text && this.text(text), this
                    }, XMLDocumentCB.prototype.element = function(name, attributes, text) {
                        return this.currentNode && this.currentNode instanceof XMLDocType ? this.dtdElement.apply(this, arguments) : this.node(name, attributes, text)
                    }, XMLDocumentCB.prototype.attribute = function(name, value) {
                        var attName, attValue;
                        if (!this.currentNode || this.currentNode.children) throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(name));
                        if (null != name && (name = getValue(name)), isObject(name))
                            for (attName in name) hasProp.call(name, attName) && (attValue = name[attName], this.attribute(attName, attValue));
                        else isFunction(value) && (value = value.apply()), this.options.skipNullAttributes && null == value || (this.currentNode.attributes[name] = new XMLAttribute(this, name, value));
                        return this
                    }, XMLDocumentCB.prototype.text = function(value) {
                        var node;
                        return this.openCurrent(), node = new XMLText(this, value), this.onData(this.writer.text(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.cdata = function(value) {
                        var node;
                        return this.openCurrent(), node = new XMLCData(this, value), this.onData(this.writer.cdata(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.comment = function(value) {
                        var node;
                        return this.openCurrent(), node = new XMLComment(this, value), this.onData(this.writer.comment(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.raw = function(value) {
                        var node;
                        return this.openCurrent(), node = new XMLRaw(this, value), this.onData(this.writer.raw(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.instruction = function(target, value) {
                        var i, insTarget, insValue, len, node;
                        if (this.openCurrent(), null != target && (target = getValue(target)), null != value && (value = getValue(value)), Array.isArray(target))
                            for (i = 0, len = target.length; len > i; i++) insTarget = target[i], this.instruction(insTarget);
                        else if (isObject(target))
                            for (insTarget in target) hasProp.call(target, insTarget) && (insValue = target[insTarget], this.instruction(insTarget, insValue));
                        else isFunction(value) && (value = value.apply()), node = new XMLProcessingInstruction(this, target, value), this.onData(this.writer.processingInstruction(node, this.currentLevel + 1), this.currentLevel + 1);
                        return this
                    }, XMLDocumentCB.prototype.declaration = function(version, encoding, standalone) {
                        var node;
                        if (this.openCurrent(), this.documentStarted) throw new Error("declaration() must be the first node.");
                        return node = new XMLDeclaration(this, version, encoding, standalone), this.onData(this.writer.declaration(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.doctype = function(root, pubID, sysID) {
                        if (this.openCurrent(), null == root) throw new Error("Missing root node name.");
                        if (this.root) throw new Error("dtd() must come before the root node.");
                        return this.currentNode = new XMLDocType(this, pubID, sysID), this.currentNode.rootNodeName = root, this.currentNode.children = !1, this.currentLevel++, this.openTags[this.currentLevel] = this.currentNode, this
                    }, XMLDocumentCB.prototype.dtdElement = function(name, value) {
                        var node;
                        return this.openCurrent(), node = new XMLDTDElement(this, name, value), this.onData(this.writer.dtdElement(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
                        var node;
                        return this.openCurrent(), node = new XMLDTDAttList(this, elementName, attributeName, attributeType, defaultValueType, defaultValue), this.onData(this.writer.dtdAttList(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.entity = function(name, value) {
                        var node;
                        return this.openCurrent(), node = new XMLDTDEntity(this, !1, name, value), this.onData(this.writer.dtdEntity(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.pEntity = function(name, value) {
                        var node;
                        return this.openCurrent(), node = new XMLDTDEntity(this, !0, name, value), this.onData(this.writer.dtdEntity(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.notation = function(name, value) {
                        var node;
                        return this.openCurrent(), node = new XMLDTDNotation(this, name, value), this.onData(this.writer.dtdNotation(node, this.currentLevel + 1), this.currentLevel + 1), this
                    }, XMLDocumentCB.prototype.up = function() {
                        if (this.currentLevel < 0) throw new Error("The document node has no parent.");
                        return this.currentNode ? (this.currentNode.children ? this.closeNode(this.currentNode) : this.openNode(this.currentNode), this.currentNode = null) : this.closeNode(this.openTags[this.currentLevel]), delete this.openTags[this.currentLevel], this.currentLevel--, this
                    }, XMLDocumentCB.prototype.end = function() {
                        for (; this.currentLevel >= 0;) this.up();
                        return this.onEnd()
                    }, XMLDocumentCB.prototype.openCurrent = function() {
                        return this.currentNode ? (this.currentNode.children = !0, this.openNode(this.currentNode)) : void 0
                    }, XMLDocumentCB.prototype.openNode = function(node) {
                        return node.isOpen ? void 0 : (!this.root && 0 === this.currentLevel && node instanceof XMLElement && (this.root = node), this.onData(this.writer.openNode(node, this.currentLevel), this.currentLevel), node.isOpen = !0)
                    }, XMLDocumentCB.prototype.closeNode = function(node) {
                        return node.isClosed ? void 0 : (this.onData(this.writer.closeNode(node, this.currentLevel), this.currentLevel), node.isClosed = !0)
                    }, XMLDocumentCB.prototype.onData = function(chunk, level) {
                        return this.documentStarted = !0, this.onDataCallback(chunk, level + 1)
                    }, XMLDocumentCB.prototype.onEnd = function() {
                        return this.documentCompleted = !0, this.onEndCallback()
                    }, XMLDocumentCB.prototype.debugInfo = function(name) {
                        return null == name ? "" : "node: <" + name + ">"
                    }, XMLDocumentCB.prototype.ele = function() {
                        return this.element.apply(this, arguments)
                    }, XMLDocumentCB.prototype.nod = function(name, attributes, text) {
                        return this.node(name, attributes, text)
                    }, XMLDocumentCB.prototype.txt = function(value) {
                        return this.text(value)
                    }, XMLDocumentCB.prototype.dat = function(value) {
                        return this.cdata(value)
                    }, XMLDocumentCB.prototype.com = function(value) {
                        return this.comment(value)
                    }, XMLDocumentCB.prototype.ins = function(target, value) {
                        return this.instruction(target, value)
                    }, XMLDocumentCB.prototype.dec = function(version, encoding, standalone) {
                        return this.declaration(version, encoding, standalone)
                    }, XMLDocumentCB.prototype.dtd = function(root, pubID, sysID) {
                        return this.doctype(root, pubID, sysID)
                    }, XMLDocumentCB.prototype.e = function(name, attributes, text) {
                        return this.element(name, attributes, text)
                    }, XMLDocumentCB.prototype.n = function(name, attributes, text) {
                        return this.node(name, attributes, text)
                    }, XMLDocumentCB.prototype.t = function(value) {
                        return this.text(value)
                    }, XMLDocumentCB.prototype.d = function(value) {
                        return this.cdata(value)
                    }, XMLDocumentCB.prototype.c = function(value) {
                        return this.comment(value)
                    }, XMLDocumentCB.prototype.r = function(value) {
                        return this.raw(value)
                    }, XMLDocumentCB.prototype.i = function(target, value) {
                        return this.instruction(target, value)
                    }, XMLDocumentCB.prototype.att = function() {
                        return this.currentNode && this.currentNode instanceof XMLDocType ? this.attList.apply(this, arguments) : this.attribute.apply(this, arguments)
                    }, XMLDocumentCB.prototype.a = function() {
                        return this.currentNode && this.currentNode instanceof XMLDocType ? this.attList.apply(this, arguments) : this.attribute.apply(this, arguments)
                    }, XMLDocumentCB.prototype.ent = function(name, value) {
                        return this.entity(name, value)
                    }, XMLDocumentCB.prototype.pent = function(name, value) {
                        return this.pEntity(name, value)
                    }, XMLDocumentCB.prototype.not = function(name, value) {
                        return this.notation(name, value)
                    }, XMLDocumentCB
                }()
            }).call(this)
        }, {
            "./Utility": 158,
            "./XMLAttribute": 159,
            "./XMLCData": 160,
            "./XMLComment": 161,
            "./XMLDTDAttList": 162,
            "./XMLDTDElement": 163,
            "./XMLDTDEntity": 164,
            "./XMLDTDNotation": 165,
            "./XMLDeclaration": 166,
            "./XMLDocType": 167,
            "./XMLElement": 170,
            "./XMLProcessingInstruction": 172,
            "./XMLRaw": 173,
            "./XMLStringWriter": 175,
            "./XMLStringifier": 176,
            "./XMLText": 177
        }],
        170: [function(require, module, exports) {
            (function() {
                var XMLAttribute, XMLElement, XMLNode, getValue, isFunction, isObject, ref, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                ref = require("./Utility"), isObject = ref.isObject, isFunction = ref.isFunction, getValue = ref.getValue, XMLNode = require("./XMLNode"), XMLAttribute = require("./XMLAttribute"), module.exports = XMLElement = function(superClass) {
                    function XMLElement(parent, name, attributes) {
                        if (XMLElement.__super__.constructor.call(this, parent), null == name) throw new Error("Missing element name. " + this.debugInfo());
                        this.name = this.stringify.eleName(name), this.attributes = {}, null != attributes && this.attribute(attributes), parent.isDocument && (this.isRoot = !0, this.documentObject = parent, parent.rootObject = this)
                    }
                    return extend(XMLElement, superClass), XMLElement.prototype.clone = function() {
                        var att, attName, clonedSelf, ref1;
                        clonedSelf = Object.create(this), clonedSelf.isRoot && (clonedSelf.documentObject = null), clonedSelf.attributes = {}, ref1 = this.attributes;
                        for (attName in ref1) hasProp.call(ref1, attName) && (att = ref1[attName], clonedSelf.attributes[attName] = att.clone());
                        return clonedSelf.children = [], this.children.forEach(function(child) {
                            var clonedChild;
                            return clonedChild = child.clone(), clonedChild.parent = clonedSelf, clonedSelf.children.push(clonedChild)
                        }), clonedSelf
                    }, XMLElement.prototype.attribute = function(name, value) {
                        var attName, attValue;
                        if (null != name && (name = getValue(name)), isObject(name))
                            for (attName in name) hasProp.call(name, attName) && (attValue = name[attName], this.attribute(attName, attValue));
                        else isFunction(value) && (value = value.apply()), this.options.skipNullAttributes && null == value || (this.attributes[name] = new XMLAttribute(this, name, value));
                        return this
                    }, XMLElement.prototype.removeAttribute = function(name) {
                        var attName, i, len;
                        if (null == name) throw new Error("Missing attribute name. " + this.debugInfo());
                        if (name = getValue(name), Array.isArray(name))
                            for (i = 0, len = name.length; len > i; i++) attName = name[i], delete this.attributes[attName];
                        else delete this.attributes[name];
                        return this
                    }, XMLElement.prototype.toString = function(options) {
                        return this.options.writer.set(options).element(this)
                    }, XMLElement.prototype.att = function(name, value) {
                        return this.attribute(name, value)
                    }, XMLElement.prototype.a = function(name, value) {
                        return this.attribute(name, value)
                    }, XMLElement
                }(XMLNode)
            }).call(this)
        }, {
            "./Utility": 158,
            "./XMLAttribute": 159,
            "./XMLNode": 171
        }],
        171: [function(require, module, exports) {
            (function() {
                var XMLCData, XMLComment, XMLDeclaration, XMLDocType, XMLElement, XMLNode, XMLProcessingInstruction, XMLRaw, XMLText, getValue, isEmpty, isFunction, isObject, ref, hasProp = {}.hasOwnProperty;
                ref = require("./Utility"), isObject = ref.isObject, isFunction = ref.isFunction, isEmpty = ref.isEmpty, getValue = ref.getValue, XMLElement = null, XMLCData = null, XMLComment = null, XMLDeclaration = null, XMLDocType = null, XMLRaw = null, XMLText = null, XMLProcessingInstruction = null, module.exports = XMLNode = function() {
                    function XMLNode(parent) {
                        this.parent = parent, this.parent && (this.options = this.parent.options, this.stringify = this.parent.stringify), this.children = [], XMLElement || (XMLElement = require("./XMLElement"), XMLCData = require("./XMLCData"), XMLComment = require("./XMLComment"), XMLDeclaration = require("./XMLDeclaration"), XMLDocType = require("./XMLDocType"), XMLRaw = require("./XMLRaw"), XMLText = require("./XMLText"), XMLProcessingInstruction = require("./XMLProcessingInstruction"))
                    }
                    return XMLNode.prototype.element = function(name, attributes, text) {
                        var childNode, item, j, k, key, lastChild, len, len1, ref1, val;
                        if (lastChild = null, null == attributes && (attributes = {}), attributes = getValue(attributes), isObject(attributes) || (ref1 = [attributes, text], text = ref1[0], attributes = ref1[1]), null != name && (name = getValue(name)), Array.isArray(name))
                            for (j = 0, len = name.length; len > j; j++) item = name[j], lastChild = this.element(item);
                        else if (isFunction(name)) lastChild = this.element(name.apply());
                        else if (isObject(name)) {
                            for (key in name)
                                if (hasProp.call(name, key))
                                    if (val = name[key], isFunction(val) && (val = val.apply()), isObject(val) && isEmpty(val) && (val = null), !this.options.ignoreDecorators && this.stringify.convertAttKey && 0 === key.indexOf(this.stringify.convertAttKey)) lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
                                    else if (!this.options.separateArrayItems && Array.isArray(val))
                                for (k = 0, len1 = val.length; len1 > k; k++) item = val[k], childNode = {}, childNode[key] = item, lastChild = this.element(childNode);
                            else isObject(val) ? (lastChild = this.element(key), lastChild.element(val)) : lastChild = this.element(key, val)
                        } else lastChild = !this.options.ignoreDecorators && this.stringify.convertTextKey && 0 === name.indexOf(this.stringify.convertTextKey) ? this.text(text) : !this.options.ignoreDecorators && this.stringify.convertCDataKey && 0 === name.indexOf(this.stringify.convertCDataKey) ? this.cdata(text) : !this.options.ignoreDecorators && this.stringify.convertCommentKey && 0 === name.indexOf(this.stringify.convertCommentKey) ? this.comment(text) : !this.options.ignoreDecorators && this.stringify.convertRawKey && 0 === name.indexOf(this.stringify.convertRawKey) ? this.raw(text) : !this.options.ignoreDecorators && this.stringify.convertPIKey && 0 === name.indexOf(this.stringify.convertPIKey) ? this.instruction(name.substr(this.stringify.convertPIKey.length), text) : this.node(name, attributes, text);
                        if (null == lastChild) throw new Error("Could not create any elements with: " + name + ". " + this.debugInfo());
                        return lastChild
                    }, XMLNode.prototype.insertBefore = function(name, attributes, text) {
                        var child, i, removed;
                        if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
                        return i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i), child = this.parent.element(name, attributes, text), Array.prototype.push.apply(this.parent.children, removed), child
                    }, XMLNode.prototype.insertAfter = function(name, attributes, text) {
                        var child, i, removed;
                        if (this.isRoot) throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
                        return i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i + 1), child = this.parent.element(name, attributes, text), Array.prototype.push.apply(this.parent.children, removed), child
                    }, XMLNode.prototype.remove = function() {
                        var i, ref1;
                        if (this.isRoot) throw new Error("Cannot remove the root element. " + this.debugInfo());
                        return i = this.parent.children.indexOf(this), [].splice.apply(this.parent.children, [i, i - i + 1].concat(ref1 = [])), ref1, this.parent
                    }, XMLNode.prototype.node = function(name, attributes, text) {
                        var child, ref1;
                        return null != name && (name = getValue(name)), attributes || (attributes = {}), attributes = getValue(attributes), isObject(attributes) || (ref1 = [attributes, text], text = ref1[0], attributes = ref1[1]), child = new XMLElement(this, name, attributes), null != text && child.text(text), this.children.push(child), child
                    }, XMLNode.prototype.text = function(value) {
                        var child;
                        return child = new XMLText(this, value), this.children.push(child), this
                    }, XMLNode.prototype.cdata = function(value) {
                        var child;
                        return child = new XMLCData(this, value), this.children.push(child), this
                    }, XMLNode.prototype.comment = function(value) {
                        var child;
                        return child = new XMLComment(this, value), this.children.push(child), this
                    }, XMLNode.prototype.commentBefore = function(value) {
                        var child, i, removed;
                        return i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i), child = this.parent.comment(value), Array.prototype.push.apply(this.parent.children, removed), this
                    }, XMLNode.prototype.commentAfter = function(value) {
                        var child, i, removed;
                        return i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i + 1), child = this.parent.comment(value), Array.prototype.push.apply(this.parent.children, removed), this
                    }, XMLNode.prototype.raw = function(value) {
                        var child;
                        return child = new XMLRaw(this, value), this.children.push(child), this
                    }, XMLNode.prototype.instruction = function(target, value) {
                        var insTarget, insValue, instruction, j, len;
                        if (null != target && (target = getValue(target)), null != value && (value = getValue(value)), Array.isArray(target))
                            for (j = 0, len = target.length; len > j; j++) insTarget = target[j], this.instruction(insTarget);
                        else if (isObject(target))
                            for (insTarget in target) hasProp.call(target, insTarget) && (insValue = target[insTarget], this.instruction(insTarget, insValue));
                        else isFunction(value) && (value = value.apply()), instruction = new XMLProcessingInstruction(this, target, value), this.children.push(instruction);
                        return this
                    }, XMLNode.prototype.instructionBefore = function(target, value) {
                        var child, i, removed;
                        return i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i), child = this.parent.instruction(target, value), Array.prototype.push.apply(this.parent.children, removed), this
                    }, XMLNode.prototype.instructionAfter = function(target, value) {
                        var child, i, removed;
                        return i = this.parent.children.indexOf(this), removed = this.parent.children.splice(i + 1), child = this.parent.instruction(target, value), Array.prototype.push.apply(this.parent.children, removed), this
                    }, XMLNode.prototype.declaration = function(version, encoding, standalone) {
                        var doc, xmldec;
                        return doc = this.document(), xmldec = new XMLDeclaration(doc, version, encoding, standalone), doc.children[0] instanceof XMLDeclaration ? doc.children[0] = xmldec : doc.children.unshift(xmldec), doc.root() || doc
                    }, XMLNode.prototype.doctype = function(pubID, sysID) {
                        var child, doc, doctype, i, j, k, len, len1, ref1, ref2;
                        for (doc = this.document(), doctype = new XMLDocType(doc, pubID, sysID), ref1 = doc.children, i = j = 0, len = ref1.length; len > j; i = ++j)
                            if (child = ref1[i], child instanceof XMLDocType) return doc.children[i] = doctype, doctype;
                        for (ref2 = doc.children, i = k = 0, len1 = ref2.length; len1 > k; i = ++k)
                            if (child = ref2[i], child.isRoot) return doc.children.splice(i, 0, doctype), doctype;
                        return doc.children.push(doctype), doctype
                    }, XMLNode.prototype.up = function() {
                        if (this.isRoot) throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
                        return this.parent
                    }, XMLNode.prototype.root = function() {
                        var node;
                        for (node = this; node;) {
                            if (node.isDocument) return node.rootObject;
                            if (node.isRoot) return node;
                            node = node.parent
                        }
                    }, XMLNode.prototype.document = function() {
                        var node;
                        for (node = this; node;) {
                            if (node.isDocument) return node;
                            node = node.parent
                        }
                    }, XMLNode.prototype.end = function(options) {
                        return this.document().end(options)
                    }, XMLNode.prototype.prev = function() {
                        var i;
                        if (i = this.parent.children.indexOf(this), 1 > i) throw new Error("Already at the first node. " + this.debugInfo());
                        return this.parent.children[i - 1]
                    }, XMLNode.prototype.next = function() {
                        var i;
                        if (i = this.parent.children.indexOf(this), -1 === i || i === this.parent.children.length - 1) throw new Error("Already at the last node. " + this.debugInfo());
                        return this.parent.children[i + 1]
                    }, XMLNode.prototype.importDocument = function(doc) {
                        var clonedRoot;
                        return clonedRoot = doc.root().clone(), clonedRoot.parent = this, clonedRoot.isRoot = !1, this.children.push(clonedRoot), this
                    }, XMLNode.prototype.debugInfo = function(name) {
                        var ref1, ref2;
                        return name = name || this.name, null != name || (null != (ref1 = this.parent) ? ref1.name : void 0) ? null == name ? "parent: <" + this.parent.name + ">" : (null != (ref2 = this.parent) ? ref2.name : void 0) ? "node: <" + name + ">, parent: <" + this.parent.name + ">" : "node: <" + name + ">" : ""
                    }, XMLNode.prototype.ele = function(name, attributes, text) {
                        return this.element(name, attributes, text)
                    }, XMLNode.prototype.nod = function(name, attributes, text) {
                        return this.node(name, attributes, text)
                    }, XMLNode.prototype.txt = function(value) {
                        return this.text(value)
                    }, XMLNode.prototype.dat = function(value) {
                        return this.cdata(value)
                    }, XMLNode.prototype.com = function(value) {
                        return this.comment(value)
                    }, XMLNode.prototype.ins = function(target, value) {
                        return this.instruction(target, value)
                    }, XMLNode.prototype.doc = function() {
                        return this.document()
                    }, XMLNode.prototype.dec = function(version, encoding, standalone) {
                        return this.declaration(version, encoding, standalone)
                    }, XMLNode.prototype.dtd = function(pubID, sysID) {
                        return this.doctype(pubID, sysID)
                    }, XMLNode.prototype.e = function(name, attributes, text) {
                        return this.element(name, attributes, text)
                    }, XMLNode.prototype.n = function(name, attributes, text) {
                        return this.node(name, attributes, text)
                    }, XMLNode.prototype.t = function(value) {
                        return this.text(value)
                    }, XMLNode.prototype.d = function(value) {
                        return this.cdata(value)
                    }, XMLNode.prototype.c = function(value) {
                        return this.comment(value)
                    }, XMLNode.prototype.r = function(value) {
                        return this.raw(value)
                    }, XMLNode.prototype.i = function(target, value) {
                        return this.instruction(target, value)
                    }, XMLNode.prototype.u = function() {
                        return this.up()
                    }, XMLNode.prototype.importXMLBuilder = function(doc) {
                        return this.importDocument(doc)
                    }, XMLNode
                }()
            }).call(this)
        }, {
            "./Utility": 158,
            "./XMLCData": 160,
            "./XMLComment": 161,
            "./XMLDeclaration": 166,
            "./XMLDocType": 167,
            "./XMLElement": 170,
            "./XMLProcessingInstruction": 172,
            "./XMLRaw": 173,
            "./XMLText": 177
        }],
        172: [function(require, module, exports) {
            (function() {
                var XMLNode, XMLProcessingInstruction, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLNode = require("./XMLNode"), module.exports = XMLProcessingInstruction = function(superClass) {
                    function XMLProcessingInstruction(parent, target, value) {
                        if (XMLProcessingInstruction.__super__.constructor.call(this, parent), null == target) throw new Error("Missing instruction target. " + this.debugInfo());
                        this.target = this.stringify.insTarget(target), value && (this.value = this.stringify.insValue(value))
                    }
                    return extend(XMLProcessingInstruction, superClass), XMLProcessingInstruction.prototype.clone = function() {
                        return Object.create(this)
                    }, XMLProcessingInstruction.prototype.toString = function(options) {
                        return this.options.writer.set(options).processingInstruction(this)
                    }, XMLProcessingInstruction
                }(XMLNode)
            }).call(this)
        }, {
            "./XMLNode": 171
        }],
        173: [function(require, module, exports) {
            (function() {
                var XMLNode, XMLRaw, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLNode = require("./XMLNode"), module.exports = XMLRaw = function(superClass) {
                    function XMLRaw(parent, text) {
                        if (XMLRaw.__super__.constructor.call(this, parent), null == text) throw new Error("Missing raw text. " + this.debugInfo());
                        this.value = this.stringify.raw(text)
                    }
                    return extend(XMLRaw, superClass), XMLRaw.prototype.clone = function() {
                        return Object.create(this)
                    }, XMLRaw.prototype.toString = function(options) {
                        return this.options.writer.set(options).raw(this)
                    }, XMLRaw
                }(XMLNode)
            }).call(this)
        }, {
            "./XMLNode": 171
        }],
        174: [function(require, module, exports) {
            (function() {
                var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStreamWriter, XMLText, XMLWriterBase, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLDeclaration = require("./XMLDeclaration"), XMLDocType = require("./XMLDocType"), XMLCData = require("./XMLCData"), XMLComment = require("./XMLComment"), XMLElement = require("./XMLElement"), XMLRaw = require("./XMLRaw"), XMLText = require("./XMLText"), XMLProcessingInstruction = require("./XMLProcessingInstruction"), XMLDTDAttList = require("./XMLDTDAttList"), XMLDTDElement = require("./XMLDTDElement"), XMLDTDEntity = require("./XMLDTDEntity"), XMLDTDNotation = require("./XMLDTDNotation"), XMLWriterBase = require("./XMLWriterBase"), module.exports = XMLStreamWriter = function(superClass) {
                    function XMLStreamWriter(stream, options) {
                        XMLStreamWriter.__super__.constructor.call(this, options), this.stream = stream
                    }
                    return extend(XMLStreamWriter, superClass), XMLStreamWriter.prototype.document = function(doc) {
                        var child, i, j, len, len1, ref, ref1, results;
                        for (ref = doc.children, i = 0, len = ref.length; len > i; i++) child = ref[i], child.isLastRootNode = !1;
                        for (doc.children[doc.children.length - 1].isLastRootNode = !0, ref1 = doc.children, results = [], j = 0, len1 = ref1.length; len1 > j; j++) switch (child = ref1[j], !1) {
                            case !(child instanceof XMLDeclaration):
                                results.push(this.declaration(child));
                                break;
                            case !(child instanceof XMLDocType):
                                results.push(this.docType(child));
                                break;
                            case !(child instanceof XMLComment):
                                results.push(this.comment(child));
                                break;
                            case !(child instanceof XMLProcessingInstruction):
                                results.push(this.processingInstruction(child));
                                break;
                            default:
                                results.push(this.element(child))
                        }
                        return results
                    }, XMLStreamWriter.prototype.attribute = function(att) {
                        return this.stream.write(" " + att.name + '="' + att.value + '"')
                    }, XMLStreamWriter.prototype.cdata = function(node, level) {
                        return this.stream.write(this.space(level) + "<![CDATA[" + node.text + "]]>" + this.endline(node))
                    }, XMLStreamWriter.prototype.comment = function(node, level) {
                        return this.stream.write(this.space(level) + "<!-- " + node.text + " -->" + this.endline(node))
                    }, XMLStreamWriter.prototype.declaration = function(node, level) {
                        return this.stream.write(this.space(level)), this.stream.write('<?xml version="' + node.version + '"'), null != node.encoding && this.stream.write(' encoding="' + node.encoding + '"'), null != node.standalone && this.stream.write(' standalone="' + node.standalone + '"'), this.stream.write(this.spacebeforeslash + "?>"), this.stream.write(this.endline(node))
                    }, XMLStreamWriter.prototype.docType = function(node, level) {
                        var child, i, len, ref;
                        if (level || (level = 0), this.stream.write(this.space(level)), this.stream.write("<!DOCTYPE " + node.root().name), node.pubID && node.sysID ? this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"') : node.sysID && this.stream.write(' SYSTEM "' + node.sysID + '"'), node.children.length > 0) {
                            for (this.stream.write(" ["), this.stream.write(this.endline(node)), ref = node.children, i = 0, len = ref.length; len > i; i++) switch (child = ref[i], !1) {
                                case !(child instanceof XMLDTDAttList):
                                    this.dtdAttList(child, level + 1);
                                    break;
                                case !(child instanceof XMLDTDElement):
                                    this.dtdElement(child, level + 1);
                                    break;
                                case !(child instanceof XMLDTDEntity):
                                    this.dtdEntity(child, level + 1);
                                    break;
                                case !(child instanceof XMLDTDNotation):
                                    this.dtdNotation(child, level + 1);
                                    break;
                                case !(child instanceof XMLCData):
                                    this.cdata(child, level + 1);
                                    break;
                                case !(child instanceof XMLComment):
                                    this.comment(child, level + 1);
                                    break;
                                case !(child instanceof XMLProcessingInstruction):
                                    this.processingInstruction(child, level + 1);
                                    break;
                                default:
                                    throw new Error("Unknown DTD node type: " + child.constructor.name)
                            }
                            this.stream.write("]")
                        }
                        return this.stream.write(this.spacebeforeslash + ">"), this.stream.write(this.endline(node))
                    }, XMLStreamWriter.prototype.element = function(node, level) {
                        var att, child, i, len, name, ref, ref1, space;
                        level || (level = 0), space = this.space(level), this.stream.write(space + "<" + node.name), ref = node.attributes;
                        for (name in ref) hasProp.call(ref, name) && (att = ref[name], this.attribute(att));
                        if (0 === node.children.length || node.children.every(function(e) {
                                return "" === e.value
                            })) this.allowEmpty ? this.stream.write("></" + node.name + ">") : this.stream.write(this.spacebeforeslash + "/>");
                        else if (this.pretty && 1 === node.children.length && null != node.children[0].value) this.stream.write(">"), this.stream.write(node.children[0].value), this.stream.write("</" + node.name + ">");
                        else {
                            for (this.stream.write(">" + this.newline), ref1 = node.children, i = 0, len = ref1.length; len > i; i++) switch (child = ref1[i], !1) {
                                case !(child instanceof XMLCData):
                                    this.cdata(child, level + 1);
                                    break;
                                case !(child instanceof XMLComment):
                                    this.comment(child, level + 1);
                                    break;
                                case !(child instanceof XMLElement):
                                    this.element(child, level + 1);
                                    break;
                                case !(child instanceof XMLRaw):
                                    this.raw(child, level + 1);
                                    break;
                                case !(child instanceof XMLText):
                                    this.text(child, level + 1);
                                    break;
                                case !(child instanceof XMLProcessingInstruction):
                                    this.processingInstruction(child, level + 1);
                                    break;
                                default:
                                    throw new Error("Unknown XML node type: " + child.constructor.name)
                            }
                            this.stream.write(space + "</" + node.name + ">")
                        }
                        return this.stream.write(this.endline(node))
                    }, XMLStreamWriter.prototype.processingInstruction = function(node, level) {
                        return this.stream.write(this.space(level) + "<?" + node.target), node.value && this.stream.write(" " + node.value), this.stream.write(this.spacebeforeslash + "?>" + this.endline(node))
                    }, XMLStreamWriter.prototype.raw = function(node, level) {
                        return this.stream.write(this.space(level) + node.value + this.endline(node))
                    }, XMLStreamWriter.prototype.text = function(node, level) {
                        return this.stream.write(this.space(level) + node.value + this.endline(node))
                    }, XMLStreamWriter.prototype.dtdAttList = function(node, level) {
                        return this.stream.write(this.space(level) + "<!ATTLIST " + node.elementName + " " + node.attributeName + " " + node.attributeType), "#DEFAULT" !== node.defaultValueType && this.stream.write(" " + node.defaultValueType), node.defaultValue && this.stream.write(' "' + node.defaultValue + '"'), this.stream.write(this.spacebeforeslash + ">" + this.endline(node))
                    }, XMLStreamWriter.prototype.dtdElement = function(node, level) {
                        return this.stream.write(this.space(level) + "<!ELEMENT " + node.name + " " + node.value), this.stream.write(this.spacebeforeslash + ">" + this.endline(node))
                    }, XMLStreamWriter.prototype.dtdEntity = function(node, level) {
                        return this.stream.write(this.space(level) + "<!ENTITY"), node.pe && this.stream.write(" %"), this.stream.write(" " + node.name), node.value ? this.stream.write(' "' + node.value + '"') : (node.pubID && node.sysID ? this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"') : node.sysID && this.stream.write(' SYSTEM "' + node.sysID + '"'), node.nData && this.stream.write(" NDATA " + node.nData)), this.stream.write(this.spacebeforeslash + ">" + this.endline(node))
                    }, XMLStreamWriter.prototype.dtdNotation = function(node, level) {
                        return this.stream.write(this.space(level) + "<!NOTATION " + node.name), node.pubID && node.sysID ? this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"') : node.pubID ? this.stream.write(' PUBLIC "' + node.pubID + '"') : node.sysID && this.stream.write(' SYSTEM "' + node.sysID + '"'), this.stream.write(this.spacebeforeslash + ">" + this.endline(node))
                    }, XMLStreamWriter.prototype.endline = function(node) {
                        return node.isLastRootNode ? "" : this.newline
                    }, XMLStreamWriter
                }(XMLWriterBase)
            }).call(this)
        }, {
            "./XMLCData": 160,
            "./XMLComment": 161,
            "./XMLDTDAttList": 162,
            "./XMLDTDElement": 163,
            "./XMLDTDEntity": 164,
            "./XMLDTDNotation": 165,
            "./XMLDeclaration": 166,
            "./XMLDocType": 167,
            "./XMLElement": 170,
            "./XMLProcessingInstruction": 172,
            "./XMLRaw": 173,
            "./XMLText": 177,
            "./XMLWriterBase": 178
        }],
        175: [function(require, module, exports) {
            (function() {
                var XMLCData, XMLComment, XMLDTDAttList, XMLDTDElement, XMLDTDEntity, XMLDTDNotation, XMLDeclaration, XMLDocType, XMLElement, XMLProcessingInstruction, XMLRaw, XMLStringWriter, XMLText, XMLWriterBase, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLDeclaration = require("./XMLDeclaration"), XMLDocType = require("./XMLDocType"), XMLCData = require("./XMLCData"), XMLComment = require("./XMLComment"), XMLElement = require("./XMLElement"), XMLRaw = require("./XMLRaw"), XMLText = require("./XMLText"), XMLProcessingInstruction = require("./XMLProcessingInstruction"), XMLDTDAttList = require("./XMLDTDAttList"), XMLDTDElement = require("./XMLDTDElement"), XMLDTDEntity = require("./XMLDTDEntity"), XMLDTDNotation = require("./XMLDTDNotation"), XMLWriterBase = require("./XMLWriterBase"), module.exports = XMLStringWriter = function(superClass) {
                    function XMLStringWriter(options) {
                        XMLStringWriter.__super__.constructor.call(this, options)
                    }
                    return extend(XMLStringWriter, superClass), XMLStringWriter.prototype.document = function(doc) {
                        var child, i, len, r, ref;
                        for (this.textispresent = !1, r = "", ref = doc.children, i = 0, len = ref.length; len > i; i++) child = ref[i], r += function() {
                            switch (!1) {
                                case !(child instanceof XMLDeclaration):
                                    return this.declaration(child);
                                case !(child instanceof XMLDocType):
                                    return this.docType(child);
                                case !(child instanceof XMLComment):
                                    return this.comment(child);
                                case !(child instanceof XMLProcessingInstruction):
                                    return this.processingInstruction(child);
                                default:
                                    return this.element(child, 0)
                            }
                        }.call(this);
                        return this.pretty && r.slice(-this.newline.length) === this.newline && (r = r.slice(0, -this.newline.length)), r
                    }, XMLStringWriter.prototype.attribute = function(att) {
                        return " " + att.name + '="' + att.value + '"'
                    }, XMLStringWriter.prototype.cdata = function(node, level) {
                        return this.space(level) + "<![CDATA[" + node.text + "]]>" + this.newline
                    }, XMLStringWriter.prototype.comment = function(node, level) {
                        return this.space(level) + "<!-- " + node.text + " -->" + this.newline
                    }, XMLStringWriter.prototype.declaration = function(node, level) {
                        var r;
                        return r = this.space(level), r += '<?xml version="' + node.version + '"', null != node.encoding && (r += ' encoding="' + node.encoding + '"'), null != node.standalone && (r += ' standalone="' + node.standalone + '"'), r += this.spacebeforeslash + "?>", r += this.newline
                    }, XMLStringWriter.prototype.docType = function(node, level) {
                        var child, i, len, r, ref;
                        if (level || (level = 0), r = this.space(level), r += "<!DOCTYPE " + node.root().name, node.pubID && node.sysID ? r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"' : node.sysID && (r += ' SYSTEM "' + node.sysID + '"'), node.children.length > 0) {
                            for (r += " [", r += this.newline, ref = node.children, i = 0, len = ref.length; len > i; i++) child = ref[i], r += function() {
                                switch (!1) {
                                    case !(child instanceof XMLDTDAttList):
                                        return this.dtdAttList(child, level + 1);
                                    case !(child instanceof XMLDTDElement):
                                        return this.dtdElement(child, level + 1);
                                    case !(child instanceof XMLDTDEntity):
                                        return this.dtdEntity(child, level + 1);
                                    case !(child instanceof XMLDTDNotation):
                                        return this.dtdNotation(child, level + 1);
                                    case !(child instanceof XMLCData):
                                        return this.cdata(child, level + 1);
                                    case !(child instanceof XMLComment):
                                        return this.comment(child, level + 1);
                                    case !(child instanceof XMLProcessingInstruction):
                                        return this.processingInstruction(child, level + 1);
                                    default:
                                        throw new Error("Unknown DTD node type: " + child.constructor.name)
                                }
                            }.call(this);
                            r += "]"
                        }
                        return r += this.spacebeforeslash + ">", r += this.newline
                    }, XMLStringWriter.prototype.element = function(node, level) {
                        var att, child, i, j, len, len1, name, r, ref, ref1, ref2, space, textispresentwasset;
                        level || (level = 0), textispresentwasset = !1, this.textispresent ? (this.newline = "", this.pretty = !1) : (this.newline = this.newlinedefault, this.pretty = this.prettydefault), space = this.space(level), r = "", r += space + "<" + node.name, ref = node.attributes;
                        for (name in ref) hasProp.call(ref, name) && (att = ref[name], r += this.attribute(att));
                        if (0 === node.children.length || node.children.every(function(e) {
                                return "" === e.value
                            })) r += this.allowEmpty ? "></" + node.name + ">" + this.newline : this.spacebeforeslash + "/>" + this.newline;
                        else if (this.pretty && 1 === node.children.length && null != node.children[0].value) r += ">", r += node.children[0].value, r += "</" + node.name + ">" + this.newline;
                        else {
                            if (this.dontprettytextnodes)
                                for (ref1 = node.children, i = 0, len = ref1.length; len > i; i++)
                                    if (child = ref1[i], null != child.value) {
                                        this.textispresent++, textispresentwasset = !0;
                                        break
                                    } for (this.textispresent && (this.newline = "", this.pretty = !1, space = this.space(level)), r += ">" + this.newline, ref2 = node.children, j = 0, len1 = ref2.length; len1 > j; j++) child = ref2[j], r += function() {
                                switch (!1) {
                                    case !(child instanceof XMLCData):
                                        return this.cdata(child, level + 1);
                                    case !(child instanceof XMLComment):
                                        return this.comment(child, level + 1);
                                    case !(child instanceof XMLElement):
                                        return this.element(child, level + 1);
                                    case !(child instanceof XMLRaw):
                                        return this.raw(child, level + 1);
                                    case !(child instanceof XMLText):
                                        return this.text(child, level + 1);
                                    case !(child instanceof XMLProcessingInstruction):
                                        return this.processingInstruction(child, level + 1);
                                    default:
                                        throw new Error("Unknown XML node type: " + child.constructor.name)
                                }
                            }.call(this);
                            textispresentwasset && this.textispresent--, this.textispresent || (this.newline = this.newlinedefault, this.pretty = this.prettydefault), r += space + "</" + node.name + ">" + this.newline
                        }
                        return r
                    }, XMLStringWriter.prototype.processingInstruction = function(node, level) {
                        var r;
                        return r = this.space(level) + "<?" + node.target, node.value && (r += " " + node.value), r += this.spacebeforeslash + "?>" + this.newline
                    }, XMLStringWriter.prototype.raw = function(node, level) {
                        return this.space(level) + node.value + this.newline
                    }, XMLStringWriter.prototype.text = function(node, level) {
                        return this.space(level) + node.value + this.newline
                    }, XMLStringWriter.prototype.dtdAttList = function(node, level) {
                        var r;
                        return r = this.space(level) + "<!ATTLIST " + node.elementName + " " + node.attributeName + " " + node.attributeType, "#DEFAULT" !== node.defaultValueType && (r += " " + node.defaultValueType), node.defaultValue && (r += ' "' + node.defaultValue + '"'), r += this.spacebeforeslash + ">" + this.newline
                    }, XMLStringWriter.prototype.dtdElement = function(node, level) {
                        return this.space(level) + "<!ELEMENT " + node.name + " " + node.value + this.spacebeforeslash + ">" + this.newline
                    }, XMLStringWriter.prototype.dtdEntity = function(node, level) {
                        var r;
                        return r = this.space(level) + "<!ENTITY", node.pe && (r += " %"), r += " " + node.name, node.value ? r += ' "' + node.value + '"' : (node.pubID && node.sysID ? r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"' : node.sysID && (r += ' SYSTEM "' + node.sysID + '"'), node.nData && (r += " NDATA " + node.nData)), r += this.spacebeforeslash + ">" + this.newline
                    }, XMLStringWriter.prototype.dtdNotation = function(node, level) {
                        var r;
                        return r = this.space(level) + "<!NOTATION " + node.name, node.pubID && node.sysID ? r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"' : node.pubID ? r += ' PUBLIC "' + node.pubID + '"' : node.sysID && (r += ' SYSTEM "' + node.sysID + '"'), r += this.spacebeforeslash + ">" + this.newline
                    }, XMLStringWriter.prototype.openNode = function(node, level) {
                        var att, name, r, ref;
                        if (level || (level = 0), node instanceof XMLElement) {
                            r = this.space(level) + "<" + node.name, ref = node.attributes;
                            for (name in ref) hasProp.call(ref, name) && (att = ref[name], r += this.attribute(att));
                            return r += (node.children ? ">" : "/>") + this.newline
                        }
                        return r = this.space(level) + "<!DOCTYPE " + node.rootNodeName, node.pubID && node.sysID ? r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"' : node.sysID && (r += ' SYSTEM "' + node.sysID + '"'), r += (node.children ? " [" : ">") + this.newline
                    }, XMLStringWriter.prototype.closeNode = function(node, level) {
                        switch (level || (level = 0), !1) {
                            case !(node instanceof XMLElement):
                                return this.space(level) + "</" + node.name + ">" + this.newline;
                            case !(node instanceof XMLDocType):
                                return this.space(level) + "]>" + this.newline
                        }
                    }, XMLStringWriter
                }(XMLWriterBase)
            }).call(this)
        }, {
            "./XMLCData": 160,
            "./XMLComment": 161,
            "./XMLDTDAttList": 162,
            "./XMLDTDElement": 163,
            "./XMLDTDEntity": 164,
            "./XMLDTDNotation": 165,
            "./XMLDeclaration": 166,
            "./XMLDocType": 167,
            "./XMLElement": 170,
            "./XMLProcessingInstruction": 172,
            "./XMLRaw": 173,
            "./XMLText": 177,
            "./XMLWriterBase": 178
        }],
        176: [function(require, module, exports) {
            (function() {
                var XMLStringifier, bind = function(fn, me) {
                        return function() {
                            return fn.apply(me, arguments)
                        }
                    },
                    hasProp = {}.hasOwnProperty;
                module.exports = XMLStringifier = function() {
                    function XMLStringifier(options) {
                        this.assertLegalChar = bind(this.assertLegalChar, this);
                        var key, ref, value;
                        options || (options = {}), this.noDoubleEncoding = options.noDoubleEncoding, ref = options.stringify || {};
                        for (key in ref) hasProp.call(ref, key) && (value = ref[key], this[key] = value)
                    }
                    return XMLStringifier.prototype.eleName = function(val) {
                        return val = "" + val || "", this.assertLegalChar(val)
                    }, XMLStringifier.prototype.eleText = function(val) {
                        return val = "" + val || "", this.assertLegalChar(this.elEscape(val))
                    }, XMLStringifier.prototype.cdata = function(val) {
                        return val = "" + val || "", val = val.replace("]]>", "]]]]><![CDATA[>"), this.assertLegalChar(val)
                    }, XMLStringifier.prototype.comment = function(val) {
                        if (val = "" + val || "", val.match(/--/)) throw new Error("Comment text cannot contain double-hypen: " + val);
                        return this.assertLegalChar(val)
                    }, XMLStringifier.prototype.raw = function(val) {
                        return "" + val || ""
                    }, XMLStringifier.prototype.attName = function(val) {
                        return val = "" + val || ""
                    }, XMLStringifier.prototype.attValue = function(val) {
                        return val = "" + val || "", this.attEscape(val)
                    }, XMLStringifier.prototype.insTarget = function(val) {
                        return "" + val || ""
                    }, XMLStringifier.prototype.insValue = function(val) {
                        if (val = "" + val || "", val.match(/\?>/)) throw new Error("Invalid processing instruction value: " + val);
                        return val
                    }, XMLStringifier.prototype.xmlVersion = function(val) {
                        if (val = "" + val || "", !val.match(/1\.[0-9]+/)) throw new Error("Invalid version number: " + val);
                        return val
                    }, XMLStringifier.prototype.xmlEncoding = function(val) {
                        if (val = "" + val || "", !val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) throw new Error("Invalid encoding: " + val);
                        return val
                    }, XMLStringifier.prototype.xmlStandalone = function(val) {
                        return val ? "yes" : "no"
                    }, XMLStringifier.prototype.dtdPubID = function(val) {
                        return "" + val || ""
                    }, XMLStringifier.prototype.dtdSysID = function(val) {
                        return "" + val || ""
                    }, XMLStringifier.prototype.dtdElementValue = function(val) {
                        return "" + val || ""
                    }, XMLStringifier.prototype.dtdAttType = function(val) {
                        return "" + val || ""
                    }, XMLStringifier.prototype.dtdAttDefault = function(val) {
                        return null != val ? "" + val || "" : val
                    }, XMLStringifier.prototype.dtdEntityValue = function(val) {
                        return "" + val || ""
                    }, XMLStringifier.prototype.dtdNData = function(val) {
                        return "" + val || ""
                    }, XMLStringifier.prototype.convertAttKey = "@", XMLStringifier.prototype.convertPIKey = "?", XMLStringifier.prototype.convertTextKey = "#text", XMLStringifier.prototype.convertCDataKey = "#cdata", XMLStringifier.prototype.convertCommentKey = "#comment", XMLStringifier.prototype.convertRawKey = "#raw", XMLStringifier.prototype.assertLegalChar = function(str) {
                        var res;
                        if (res = str.match(/[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/)) throw new Error("Invalid character in string: " + str + " at index " + res.index);
                        return str
                    }, XMLStringifier.prototype.elEscape = function(str) {
                        var ampregex;
                        return ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g, str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;")
                    }, XMLStringifier.prototype.attEscape = function(str) {
                        var ampregex;
                        return ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g, str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\t/g, "&#x9;").replace(/\n/g, "&#xA;").replace(/\r/g, "&#xD;")
                    }, XMLStringifier
                }()
            }).call(this)
        }, {}],
        177: [function(require, module, exports) {
            (function() {
                var XMLNode, XMLText, extend = function(child, parent) {
                        function ctor() {
                            this.constructor = child
                        }
                        for (var key in parent) hasProp.call(parent, key) && (child[key] = parent[key]);
                        return ctor.prototype = parent.prototype, child.prototype = new ctor, child.__super__ = parent.prototype, child
                    },
                    hasProp = {}.hasOwnProperty;
                XMLNode = require("./XMLNode"), module.exports = XMLText = function(superClass) {
                    function XMLText(parent, text) {
                        if (XMLText.__super__.constructor.call(this, parent), null == text) throw new Error("Missing element text. " + this.debugInfo());
                        this.value = this.stringify.eleText(text)
                    }
                    return extend(XMLText, superClass), XMLText.prototype.clone = function() {
                        return Object.create(this)
                    }, XMLText.prototype.toString = function(options) {
                        return this.options.writer.set(options).text(this)
                    }, XMLText
                }(XMLNode)
            }).call(this)
        }, {
            "./XMLNode": 171
        }],
        178: [function(require, module, exports) {
            (function() {
                var XMLWriterBase, hasProp = {}.hasOwnProperty;
                module.exports = XMLWriterBase = function() {
                    function XMLWriterBase(options) {
                        var key, ref, ref1, ref2, ref3, ref4, ref5, ref6, value;
                        options || (options = {}), this.pretty = options.pretty || !1, this.allowEmpty = null != (ref = options.allowEmpty) ? ref : !1, this.pretty ? (this.indent = null != (ref1 = options.indent) ? ref1 : "  ", this.newline = null != (ref2 = options.newline) ? ref2 : "\n", this.offset = null != (ref3 = options.offset) ? ref3 : 0, this.dontprettytextnodes = null != (ref4 = options.dontprettytextnodes) ? ref4 : 0) : (this.indent = "", this.newline = "", this.offset = 0, this.dontprettytextnodes = 0), this.spacebeforeslash = null != (ref5 = options.spacebeforeslash) ? ref5 : "", this.spacebeforeslash === !0 && (this.spacebeforeslash = " "), this.newlinedefault = this.newline, this.prettydefault = this.pretty, ref6 = options.writer || {};
                        for (key in ref6) hasProp.call(ref6, key) && (value = ref6[key], this[key] = value)
                    }
                    return XMLWriterBase.prototype.set = function(options) {
                        var key, ref, value;
                        options || (options = {}), "pretty" in options && (this.pretty = options.pretty), "allowEmpty" in options && (this.allowEmpty = options.allowEmpty), this.pretty ? (this.indent = "indent" in options ? options.indent : "  ", this.newline = "newline" in options ? options.newline : "\n", this.offset = "offset" in options ? options.offset : 0, this.dontprettytextnodes = "dontprettytextnodes" in options ? options.dontprettytextnodes : 0) : (this.indent = "", this.newline = "", this.offset = 0, this.dontprettytextnodes = 0), this.spacebeforeslash = "spacebeforeslash" in options ? options.spacebeforeslash : "", this.spacebeforeslash === !0 && (this.spacebeforeslash = " "), this.newlinedefault = this.newline, this.prettydefault = this.pretty, ref = options.writer || {};
                        for (key in ref) hasProp.call(ref, key) && (value = ref[key], this[key] = value);
                        return this
                    }, XMLWriterBase.prototype.space = function(level) {
                        var indent;
                        return this.pretty ? (indent = (level || 0) + this.offset + 1, indent > 0 ? new Array(indent).join(this.indent) : "") : ""
                    }, XMLWriterBase
                }()
            }).call(this)
        }, {}],
        179: [function(require, module, exports) {
            (function() {
                var XMLDocument, XMLDocumentCB, XMLStreamWriter, XMLStringWriter, assign, isFunction, ref;
                ref = require("./Utility"), assign = ref.assign, isFunction = ref.isFunction, XMLDocument = require("./XMLDocument"), XMLDocumentCB = require("./XMLDocumentCB"), XMLStringWriter = require("./XMLStringWriter"), XMLStreamWriter = require("./XMLStreamWriter"), module.exports.create = function(name, xmldec, doctype, options) {
                    var doc, root;
                    if (null == name) throw new Error("Root element needs a name.");
                    return options = assign({}, xmldec, doctype, options), doc = new XMLDocument(options), root = doc.element(name), options.headless || (doc.declaration(options), (null != options.pubID || null != options.sysID) && doc.doctype(options)), root
                }, module.exports.begin = function(options, onData, onEnd) {
                    var ref1;
                    return isFunction(options) && (ref1 = [options, onData], onData = ref1[0], onEnd = ref1[1], options = {}), onData ? new XMLDocumentCB(options, onData, onEnd) : new XMLDocument(options)
                }, module.exports.stringWriter = function(options) {
                    return new XMLStringWriter(options)
                }, module.exports.streamWriter = function(stream, options) {
                    return new XMLStreamWriter(stream, options)
                }
            }).call(this)
        }, {
            "./Utility": 158,
            "./XMLDocument": 168,
            "./XMLDocumentCB": 169,
            "./XMLStreamWriter": 174,
            "./XMLStringWriter": 175
        }]
    }, {}, [21])(21)
});