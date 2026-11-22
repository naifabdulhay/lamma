import asyncio, random, json, sys
from playwright.async_api import async_playwright
BASE = 'http://localhost:8899/'
BROKER = 'ws://localhost:8899/mqtt'
OUT = 'test/out/'
NAMES = ['سارة', 'محمد', 'نوف الجميلة', 'عبدالرحمن', 'جود']
ROUNDS = int(sys.argv[1]) if len(sys.argv) > 1 else 2
FORCE = sys.argv[2] if len(sys.argv) > 2 else ''
errors = []

async def phase(host):
    return await host.evaluate("(document.querySelector('.stage')||{className:''}).className")

async def answer(ph, idx, shots):
    try:
        sec = ph.locator('.pq')
        if not await sec.count(): return
        cls = await sec.get_attribute('class')
        # wait for pre to finish
        for _ in range(80):
            if not await ph.locator('.pin.hide').count(): break
            await asyncio.sleep(0.15)
        inp = [c for c in cls.split() if c.startswith('in-')][0][3:]
        mk = [c for c in cls.split() if c.startswith('m-')][0][2:]
        key = inp + '_' + mk
        await asyncio.sleep(random.uniform(0.3, 2.0) + idx * 0.2)
        if idx == 0:
            await ph.screenshot(path=f'{OUT}fp_q{len(shots):02d}_{key}.png'); shots.add(len(shots))
        if inp == 'choice':
            b = ph.locator('.popt'); n = await b.count(); await b.nth(random.randrange(n)).click()
        elif inp == 'num':
            for d in str(random.randint(1, 30)): await ph.locator(f'[data-num="{d}"]').click()
            await ph.locator('[data-num="ok"]').click()
        elif inp == 'tap':
            c = ph.locator('[data-i]'); n = await c.count(); await c.nth(random.randrange(n)).click(force=True)
        elif inp == 'order':
            b = ph.locator('.porder button'); n = await b.count()
            for i in random.sample(range(n), n): await b.nth(i).click()
        elif inp == 'seq':
            dots = await ph.locator('.dots i').count()
            for _ in range(dots): await ph.locator(f'[data-pad="{random.randrange(4)}"]').click(); await asyncio.sleep(0.12)
        elif inp == 'reflex':
            for _ in range(80):
                if await ph.locator('.rpad.go').count(): break
                await asyncio.sleep(0.1)
            await asyncio.sleep(random.uniform(0.15, 0.6)); await ph.locator('.rpad').click()
        if idx == 0 and key + '_sent' not in shots:
            shots.add(key + '_sent'); await ph.screenshot(path=f'{OUT}phone_sent_{key}.png')
    except Exception as e:
        errors.append(f'phone{idx} answer: {e}')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        hctx = await b.new_context(viewport={'width': 1600, 'height': 900})
        host = await hctx.new_page()
        host.on('pageerror', lambda e: errors.append('HOST ' + str(e)))
        host.on('console', lambda m: m.type == 'error' and errors.append('HOSTc ' + m.text))
        await host.goto(BASE + '?broker=' + BROKER + ('&force=' + FORCE if FORCE else ''))
        await asyncio.sleep(0.6)
        await host.screenshot(path=OUT + 'h_landing.png')
        await host.click('[data-go="host"]'); await host.fill('.pinbox input','1234'); await host.click('.pinbox button[type=submit]')
        for _ in range(50):
            if await host.locator('.netline.online').count(): break
            await asyncio.sleep(0.2)
        code = (await host.locator('.code b').inner_text()).strip()
        url = await host.locator('.url').inner_text()
        print('room', code, url)
        await host.screenshot(path=OUT + 'h_lobby_empty.png')
        phones = []
        for i, nm in enumerate(NAMES):
            c = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
            ph = await c.new_page(); ph.on('pageerror', lambda e, i=i: errors.append(f'P{i} ' + str(e)))
            await ph.goto(f'{BASE}?join={code}&b=0&broker={BROKER}')
            await ph.fill('#nm', nm)
            av = ph.locator('.avpick button'); await av.nth(i * 2).click()
            if i == 0: await ph.screenshot(path=OUT + 'phone_join.png')
            await ph.click('button[type=submit]')
            phones.append(ph)
        for _ in range(60):
            if await host.locator('.pchip').count() >= 5: break
            await asyncio.sleep(0.25)
        await asyncio.sleep(0.5)
        await host.screenshot(path=OUT + 'h_lobby_players.png')
        await phones[0].screenshot(path=OUT + 'phone_wait.png')
        await host.click('[data-act="start"]')
        shots = set(); hshots = set(); qcount = 0
        for rnd in range(1, ROUNDS + 1):
            await asyncio.sleep(1.0)
            if rnd == 1: await host.screenshot(path=OUT + 'h_intro.png')
            done_q = set()
            while True:
                cls = await phase(host)
                if 'ph-rend' in cls: break
                if 'ph-ready' in cls and 'ready' not in hshots:
                    hshots.add('ready'); await host.screenshot(path=OUT + 'h_ready.png'); await phones[0].screenshot(path=OUT + 'phone_ready.png')
                if 'ph-q' in cls:
                    qid = await host.evaluate("document.querySelector('.qmain').className")
                    prompt = await host.locator('.prompt').inner_text()
                    if prompt in done_q: await asyncio.sleep(0.3); continue
                    done_q.add(prompt); qcount += 1
                    m = [c for c in qid.split() if c.startswith('m-')][0]
                    # wait for pre
                    for _ in range(80):
                        if not await host.locator('.prebar').count(): break
                        if m + '_pre' not in hshots: hshots.add(m + '_pre'); await asyncio.sleep(1.2); await host.screenshot(path=f'{OUT}h_pre_{m}.png')
                        await asyncio.sleep(0.15)
                    await asyncio.sleep(0.4)
                    await host.screenshot(path=f'{OUT}f_q{qcount:02d}.png')
                    await asyncio.gather(*[answer(ph, i, shots) for i, ph in enumerate(phones)])
                    for _ in range(100):
                        if 'ph-rev' in await phase(host): break
                        await asyncio.sleep(0.2)
                    await asyncio.sleep(0.8)
                    await host.screenshot(path=f'{OUT}f_r{qcount:02d}.png'); await phones[0].screenshot(path=f'{OUT}fp_r{qcount:02d}.png')
                    if await host.locator('[data-act="next"]').count(): await host.click('[data-act="next"]')
                await asyncio.sleep(0.25)
            await asyncio.sleep(1.2)
            await host.screenshot(path=f'{OUT}h_rend{rnd}.png'); await phones[1].screenshot(path=f'{OUT}phone_rend{rnd}.png')
            if rnd < ROUNDS: await host.click('[data-act="nextround"]')
        await host.click('.actions [data-act="end"]'); await asyncio.sleep(0.3); await host.click('.actions [data-act="end"]')
        await asyncio.sleep(2.5)
        await host.screenshot(path=OUT + 'h_final.png'); await phones[0].screenshot(path=OUT + 'phone_final.png')
        print('questions played', qcount)
        print('ERRORS', len(errors)); print('\n'.join(errors[:30]))
        await b.close()
if __name__ == "__main__":
    asyncio.run(main())
