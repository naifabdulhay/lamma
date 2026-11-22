# Phone-only mode: first person is host (PIN) and also plays.
import asyncio, random, sys
FORCE = sys.argv[1] if len(sys.argv) > 1 else ''
sys.argv = sys.argv[:1]
sys.path.insert(0, 'test')
from e2e import answer, errors, BASE, BROKER
OUT = 'test/out/'
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        mk = lambda: b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
        host = await (await mk()).new_page(); host.on('pageerror', lambda e: errors.append('HOST ' + str(e)))
        await host.goto(BASE + '?broker=' + BROKER + ('&force=' + FORCE if FORCE else ''))
        await host.click('[data-go="hostplay"]'); await host.fill('.pinbox input', '1234'); await host.click('.pinbox button[type=submit]')
        await host.screenshot(path=OUT + 'pl_hostjoin.png')
        await host.fill('#nm', 'أبو محمد'); await host.locator('.avpick button').nth(3).click(); await host.click('button[type=submit]')
        await host.wait_for_selector('.netline.online', timeout=15000)
        code = (await host.locator('.code b').inner_text()).strip()
        phones = [host]
        for i, nm in enumerate(['سارة', 'فيصل', 'جود']):
            ph = await (await mk()).new_page(); ph.on('pageerror', lambda e, i=i: errors.append(f'P{i} ' + str(e)))
            await ph.goto(f'{BASE}?join={code}&b=0&broker={BROKER}'); await ph.fill('#nm', nm); await ph.click('button[type=submit]'); phones.append(ph)
        for _ in range(40):
            if await host.locator('.pchip').count() >= 4: break
            await asyncio.sleep(0.25)
        await asyncio.sleep(0.6); await host.screenshot(path=OUT + 'pl_lobby.png', full_page=True)
        await host.click('[data-act="start"]')
        shots = set(); q = 0
        while True:
            await asyncio.sleep(0.3)
            if await host.locator('#hostbar [data-act="nextround"]').count(): break
            if await host.locator('.pq').count() and not await host.locator('.pq.done').count():
                prompt = await host.locator('.pq .prompt').inner_text()
                q += 1
                if q == 1: await host.screenshot(path=OUT + 'pl_q.png')
                await asyncio.gather(*[answer(ph, i + 10, shots) for i, ph in enumerate(phones)])
                for _ in range(120):
                    if await host.locator('.prev').count(): break
                    await asyncio.sleep(0.2)
                await asyncio.sleep(0.6)
                if q in (1, 4): await host.screenshot(path=OUT + f'pl_rev{q}.png'); await phones[1].screenshot(path=OUT + f'pl_rev{q}_p1.png')
                if await host.locator('#hostbar [data-act="next"]').count(): await host.click('#hostbar [data-act="next"]')
        await asyncio.sleep(1); await host.screenshot(path=OUT + 'pl_rend.png')
        await host.click('#hostbar [data-act="end"]'); await asyncio.sleep(.3); await host.click('#hostbar [data-act="end"]'); await asyncio.sleep(2)
        await host.screenshot(path=OUT + 'pl_final.png'); await phones[2].screenshot(path=OUT + 'pl_final_p2.png')
        print('questions', q, 'errors', len(errors)); print('\n'.join(errors[:20]))
        await b.close()
asyncio.run(main())
