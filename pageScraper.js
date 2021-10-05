const fs = require('fs');
const scraperObject = {
    url: 'https://www.olx.ba/profil/nucamerc',
    async scraper(browser){
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        // Navigate to the selected page
        await page.goto(this.url);
        let scrapedData = [];
        // Wait for the required DOM to be rendered
        async function scrapeCurrentPage(){
            await page.waitForSelector('.desno');
            // Get the link to all the required books
        
            let urls = await page.$$eval('#profil_main .artikal', links => {
                // mogucnost odabira proizvoda samo koji su novi ili na stanju ili po kolicini :D

                // novo
                links = links.filter(link => link.querySelector('.cijena').textContent !== link.querySelector('.datum').textContent)

                // koristeno
                //links = links.filter(link => link.querySelector('.artikal .stanje.k').textContent !== "KORIŠTENO")

                // ekstratuj link
                links = links.map(el => el.querySelector('.artikal > a').href)
                return links;
            });
        
            // ponovi na svakoj stranici i pokupi dole navedene parametre
            let pagePromise = (link) => new Promise(async(resolve, reject) => {

                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);
                //await newPage.click('.artikal_desno img');
                //dataObj['naslovartikla'] = await newPage.$eval('#naslovartikla', text => text.textContent);
                dataObj['naslovartikla'] = await newPage.$eval('#naslovartikla', el => el.innerText);
                dataObj['cijena'] = await newPage.$$eval('.mobile-cijena > p', el => el[1].innerText);
                dataObj['stanje'] = await newPage.$$eval('.mobile-stanje > p', el => el[1].innerText);
                dataObj['kategorija'] = await newPage.$eval('.artikal_kat', text => text.innerText);




                //dataObj['olxid'] = await newPage.$eval('//html/body/div[3]/div[3]/div[1]/div[1]/div[2]/div[1]/div[15]/div[5]/div[2]', text => text.innerText);
                dataObj['opisartikla'] = await newPage.$eval('.artikal_detaljniopis_tekst', el => el.outerHTML);
                
                //dataObj['linkslike'] = await newPage.$eval('.artikal_desno img', img => img.src);

                //dataObj['linkslike2'] = await newPage.$eval('.fancybox-inner img', img => img.src);
                



                
                resolve(dataObj);
                await newPage.close();
            });

            for(link in urls){
                let currentPageData = await pagePromise(urls[link]);
                scrapedData.push(currentPageData);
                // console.log(currentPageData);
            }
            // kad zavrsi i ocita log onda predji na drugu stranu od pocetne gore navedene
            // You are going to check if this button exist first, so you know if there really is a next page.
            let nextButtonExist = false;
            try{
                const nextButton = await page.$eval('.entypo-right-open', a => a.textContent);
                nextButtonExist = true;
            }
            catch(err){
                nextButtonExist = true;
            }
            if(nextButtonExist){
                await page.click('.entypo-right-open');   
                return scrapeCurrentPage(); // Call this function recursively
            }
            await page.close();
            return scrapedData;
        }
        let data = await scrapeCurrentPage();
        console.log(data);
        return data;
    }
}

module.exports = scraperObject;