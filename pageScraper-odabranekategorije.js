const scraperObject = {
    url: 'https://www.olx.ba/profil/NucaMerc',
    async scraper(browser, category){
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        // Navigate to the selected page
        await page.goto(this.url);
        // Select the category of book to be displayed
        let selectedCategory = await page.$$eval('.filter_kat_btn', (links, _category) => {

            // Search for the element that has the matching text
            links = links.map(a => a.textContent.replace(/(\r\n\t|\n|\r|\t|^\s|\s$|\B\s|\s\B)/gm, "") === _category ? a : null);
            let link = links.filter(tx => tx !== null)[0];
            return link.href;
        }, category);
        // Navigate to the selected category
        await page.goto(selectedCategory);
        let scrapedData = [];
        // Wait for the required DOM to be rendered
        async function scrapeCurrentPage(){
            await page.waitForSelector('.desno');
            // Get the link to all the required books
            
            let urls = await page.$$eval('#profil_main .artikal', links => {
                // Make sure the book to be scraped is in stock
                links = links.filter(link => link.querySelector('.artikal .stanje.n').textContent !== "NOVO")
                // Extract the links from the data
                links = links.map(el => el.querySelector('.artikal > a').href)
                return links;
            });
            // Loop through each of those links, open a new page instance and get the relevant data from them
            let pagePromise = (link) => new Promise(async(resolve, reject) => {
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);
                dataObj['bookTitle'] = await newPage.$eval('#naslovartikla', text => text.textContent);
                dataObj['bookPrice'] = await newPage.$eval('.mobile-cijena > p', text => text.textContent);
                dataObj['imageUrl'] = await newPage.$eval('.artikal_desno img', img => img.src);
                dataObj['upc'] = await newPage.$eval('.mobile-stanje > p', text => text.textContent);
                resolve(dataObj);
                await newPage.close();
            });

            for(link in urls){
                let currentPageData = await pagePromise(urls[link]);
                scrapedData.push(currentPageData);
                // console.log(currentPageData);
            }
            // When all the data on this page is done, click the next button and start the scraping of the next page
            // You are going to check if this button exist first, so you know if there really is a next page.
            let nextButtonExist = false;
            try{
                const nextButton = await page.$eval('.entypo-right-open', a => a.textContent);
                nextButtonExist = true;
            }
            catch(err){
                nextButtonExist = false;
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