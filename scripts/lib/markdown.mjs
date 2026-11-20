import { Marked } from "marked";

const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"})[char]);
const markdown = new Marked({
  renderer: {
    blockquote(token) {
      const alert = token.text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]+([^\n]+))?(?:\n|$)/i);
      if (!alert) return false;
      const kind = alert[1].toLowerCase();
      const title = alert[2] || kind[0].toUpperCase() + kind.slice(1);
      return `<aside class="text-box text-box-${kind}"><p class="text-box-title">${escape(title)}</p>${markdown.parse(token.text.slice(alert[0].length))}</aside>\n`;
    },
    paragraph({ tokens }) {
      if (tokens.length !== 1 || tokens[0].type !== "image") return false;
      const image = tokens[0];
      const caption = image.title ? `<figcaption>${escape(image.title)}</figcaption>` : "";
      return `<figure class="article-figure">${this.parser.parseInline([{ ...image, title: null }])}${caption}</figure>\n`;
    },
  },
});

// Only trusted repository authors can supply Markdown/HTML; no remote inputs.
export const renderMarkdown = source => markdown.parse(source);
