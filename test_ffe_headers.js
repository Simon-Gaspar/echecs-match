const cheerio = require('cheerio');
fetch('https://www.echecs.asso.fr/ListeTournois.aspx?Action=ANNONCE&Level=3')
  .then(res => res.text())
  .then(html => {
    const $ = cheerio.load(html);
    const headers = [];
    $('.TableauTheme th').each((i, el) => {
      headers.push($(el).text().trim());
    });
    console.log("Headers:", headers);
    const firstRow = [];
    $('.TableauTheme tr').eq(1).find('td').each((i, el) => {
      firstRow.push($(el).text().trim());
    });
    console.log("First row:", firstRow);
    const secondRow = [];
    $('.TableauTheme tr').eq(2).find('td').each((i, el) => {
      secondRow.push($(el).html().trim());
    });
    console.log("Second row HTML:", secondRow);
  });
