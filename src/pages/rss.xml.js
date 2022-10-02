import rss from '@astrojs/rss';


const SITE = import.meta.env.SITE
export const get = () => rss({
    title: `${SITE.name} | Blog`,
    description: SITE.description,
    customData: `<language>en-us</language>`,
    site: SITE,
    items: import.meta.glob('./blog/**/*.md'),
    // items: sortedPosts.map(item => ({
    //   title: item.frontmatter.title,
    //   description: item.frontmatter.description,
    //   link: item.url,
    //   pubDate: item.frontmatter.date,
    // })),
  })