const metalsmith      = require('metalsmith')
const highlighter     = require('highlighter')
const layouts         = require('metalsmith-layouts')
const permalinks      = require('metalsmith-permalinks')
const collections     = require('metalsmith-collections')
const define          = require('metalsmith-define')
const pagination      = require('metalsmith-pagination')
const snippet         = require('metalsmith-snippet')
const date            = require('metalsmith-build-date')
const assets          = require('metalsmith-assets')
const compress        = require('metalsmith-gzip')
const sitemap         = require('metalsmith-mapsite')
const discoverHelpers = require('metalsmith-discover-helpers')
const tags            = require('metalsmith-tags')
const drafts          = require('metalsmith-drafts')
const metallic        = require('metalsmith-metallic')
const inplace         = require('metalsmith-in-place')
const extname         = require('path').extname;
const dirname         = require('path').dirname;
const basename        = require('path').basename;
const MarkdownIt      = require('markdown-it')
const mdFootnote      = require('markdown-it-footnote')
const mdAnchor        = require('markdown-it-anchor')
const mdCustomBlock   = require('markdown-it-custom-block')
const mdContainer     = require('markdown-it-container')
const mdExternalLinks = require('markdown-it-external-links')


let BASEURL = 'http://localhost:8000'
if (process.argv[2] === 'production') {
  BASEURL = 'https://tiborsimon.io'
}

let renderDate = () => {
  return (files, metalsmith, done) => {
    let moment = require('moment')
    for (let file in files) {
      let target = files[file]
      if ('date' in target) {
        target.year = moment(target.date, 'YYYY-MM-DD').format('YYYY')
        target.month = moment(target.date, 'YYYY-MM-DD').format('MM')
        target.day = moment(target.date, 'YYYY-MM-DD').format('DD')
        target.date = moment(target.date, 'YYYY-MM-DD').format('YYYY. MM. DD.')
      }
    }
    done()
  }
}

let generateUrl = () => {
  return (files, metalsmith, done) => {
    let metadata = metalsmith.metadata()
    for (let file in files) {
      let target = files[file]
      target.url = metadata.baseUrl + '/' + target.path
      if (target.tags) {
        for (let tag in target.tags) {
          let data = target.tags[tag]
          data.url = metadata.baseUrl + '/tag/' + data.slug
        }
      }
    }
    done()
  }
}

let enhanceTags = () => {
  return (files, metalsmith, done) => {
    let metadata = metalsmith.metadata()

    // Adding url to the tag list of files..
    for (let file in files) {
      let target = files[file]
      if (target.tags) {
        for (let tag in target.tags) {
          let tempTag = target.tags[tag]
          tempTag.url = metadata.baseUrl + '/tag/' + tempTag.slug + '/'
        }
      }
    }

    // Restructuring tags metadata field..
    let enhancedTags = {
      tagsByName: [],
      tagsByCount: []
    }
    for (tag in metadata.tags) {
      let urlSafe = metadata.tags[tag].urlSafe
      let files = []
      for (let item of metadata.tags[tag]) {
        files.push(item)
      }
      enhancedTags.tagsByName.push({
        tag,
        urlSafe,
        files,
        count: files.length,
        url: metadata.baseUrl + '/tag/' + urlSafe + '/'
      })
      enhancedTags.tagsByCount.push({
        tag,
        urlSafe,
        files,
        count: files.length,
        url: metadata.baseUrl + '/tag/' + urlSafe + '/'
      })
    }
    enhancedTags.tagsByCount.sort((a, b) => {
      return b.count == a.count ? ((a.urlSafe < b.urlSafe) ? -1 : (a.urlSafe > b.urlSafe) ? 1 : 0) : b.count - a.count
    })
    enhancedTags.tagsByName.sort((a, b) => {
      return (a.urlSafe < b.urlSafe) ? -1 : (a.urlSafe > b.urlSafe) ? 1 : 0
    })
    metadata.enhancedTags = enhancedTags
    done()
  }
}

let isMarkdown = function(file) {
  return /\.md|\.markdown/.test(extname(file));
}

let getId = function() {
  let text = "";
  const possible = "abcdefghijklmnopqrstuvwxyz";
  for( let i=0; i < 100; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

let escapeHtml = function(unsafe) {
  return unsafe
   .replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&#039;")
}

let renderCode = function(str, info) {
  const id = getId()
  const title = info.replace(/_/g, " ")
  let front = '<pre>'
  const back = `<button class="copy-btn" title="Copy code to clipboard" data-clipboard-target="#${id}">&#xe9b8;</button><code id="${id}">${escapeHtml(str)}</code></pre>`
  if (title.length > 0)
    front += `<div class="code-title">${title}</div>`
  return front + back
}

let myMarkdown = () => {
  return (files, metalsmith, done) => {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: renderCode
    })
    md.use(mdAnchor, {
      permalink: true,
    })
    md.use(mdFootnote)
    md.use(mdCustomBlock, {
      divider (text) {
        return `<div class="divider">${text}</div>`
      },
      img (raw) {
        const [index, alt, width, url] = raw.split('#')
        return `<figure id="fig${index}">
          <img width=${width} src="/assets/images/${url}" alt="${alt}">
          <figcaption>Fig ${index}: ${alt}</figcaption>
        </figure>`
      }
    })
    md.use(mdContainer, 'success')
    md.use(mdContainer, 'info')
    md.use(mdContainer, 'warning')
    md.use(mdContainer, 'danger')
    md.use(mdExternalLinks, {
      externalClassName: "external-link",
      internalClassName: "internal-link",
      internalDomains: [ BASEURL ],
      externalTarget: "_blank"
    })

    Object.keys(files).forEach(function(file){
      if (!isMarkdown(file)) return;
      const data = files[file];
      const dir = dirname(file);
      let html = basename(file, extname(file)) + '.html';
      if ('.' != dir) html = dir + '/' + html;

      const str = md.render(data.contents.toString());
      data.contents = new Buffer(str);

      delete files[file];
      files[html] = data;
    })
    done()
  }
}

let monitor = () => {
  return (files, metalsmith, done) => {
    // console.log(metalsmith._metadata.enhancedTags)
    done()
  }
}

metalsmith(__dirname)
  .source('contents')
  .use(myMarkdown())
  .use(drafts())
  .use(date())
  .use(define({
    blog: {
      url: 'https://tiborsimon.io',
      title: 'Tibor Simon',
      description: 'Hello world.'
    },
    baseUrl: BASEURL,
    owner: {
      url: 'https://tiborsimon.io',
      name: 'Tibor Simon'
    }
  }))
  .use(renderDate())
  .use(collections({
    articles: {
      sortBy: 'date',
      reverse: true
    },
    portfolio: {
      sortBy: 'date',
      reverse: true
    }
  }))
  .use(pagination({
    'collections.articles': {
      perPage: 4,
      first: 'index.html',
      path: 'page/:num/index.html',
      layout: 'index.html'
    }
  }))
  // .use(metallic())
  .use(inplace({
    engine: 'handlebars'
  }))
  .use(snippet({
    maxLength: 300
  }))
  .use(discoverHelpers({
    directory: 'helpers',
    pattern: /\.js$/
  }))
  .use(permalinks())
  .use(generateUrl())
  .use(tags({
    handle: 'tags',
    path:'tag/:tag/index.html',
    layout:'tag.html',
    sortBy: 'title',
    reverse: true,
    skipMetadata: false,
    slug: {mode: 'rfc3986'}
  }))
  .use(enhanceTags())
  .use(monitor())
  .use(layouts({
    engine: 'handlebars',
    partials: 'partials',
    directory: 'layouts'
  }))
  .use(assets({
    source: './assets',
    destination: './assets'
  }))
  // .use(compress())
  .use(sitemap({
    hostname: 'https://tiborsimon.io',
    changefreq: 'daily'
  }))
  .destination('publish')
  .build(function (err) {
    if (err) {
      throw err;
    }
  })

