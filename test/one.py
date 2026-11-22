import asyncio, sys
from playwright.async_api import async_playwright
B='http://localhost:8899/'; BR='ws://localhost:8899/mqtt'
async def main():
    force=sys.argv[1]; vw=int(sys.argv[2]) if len(sys.argv)>2 else 1600; vh=int(sys.argv[3]) if len(sys.argv)>3 else 900
    async with async_playwright() as p:
        b=await p.chromium.launch(); h=await (await b.new_context(viewport={'width':vw,'height':vh})).new_page()
        errs=[]; h.on('pageerror',lambda e:errs.append(str(e)))
        await h.goto(B+'?broker='+BR+'&force='+force); await h.click('[data-go="host"]')
        await h.wait_for_selector('.netline.online'); code=(await h.locator('.code b').inner_text()).strip()
        await h.screenshot(path='test/out/one_lobby.png')
        ph=await (await b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)).new_page()
        ph.on('pageerror',lambda e:errs.append('P '+str(e)))
        await ph.goto(f'{B}?join={code}&broker={BR}'); await ph.fill('#nm','تجربة'); await ph.click('button[type=submit]')
        await h.wait_for_selector('.pchip'); await h.click('[data-act="start"]')
        await h.wait_for_selector('.ph-q',timeout=20000); await asyncio.sleep(float(sys.argv[4]) if len(sys.argv)>4 else 1.5)
        await h.screenshot(path='test/out/one_host.png'); await ph.screenshot(path='test/out/one_phone.png')
        print(await ph.evaluate("(()=>{const s=document.querySelector('.pmedia svg');const c=getComputedStyle(s);return [s.outerHTML.slice(0,160),c.height,c.maxHeight,c.width,c.display].join(' | ')})()"));print(await ph.evaluate("(()=>{const s=document.querySelector('.pmedia svg');if(!s)return 'nosvg';const r=s.getBoundingClientRect();const m=document.querySelector('.pmedia').getBoundingClientRect();return [r.width,r.height,m.width,m.height].map(Math.round).join(',')})()"))
        print(errs); await b.close()
asyncio.run(main())
