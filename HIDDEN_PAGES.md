# Hidden Pages

ეს ფაილი ინახავს იმ გვერდების სიას, რომლებიც პროექტში route-ად არსებობს, მაგრამ ამჟამინდელი ძირითადი navigation/UI-დან არ ჩანს ან აქტიურად არ გამოიყენება.

განახლების თარიღი: 2026-03-23

## Current Hidden Pages

### `/:locale/_blog`
- ფაილი: `src/app/[locale]/_blog/page.tsx`
- სტატუსი: hidden / test page
- მიზეზი: route არსებობს, მაგრამ `Navbar`-იდან, `Footer`-იდან და სხვა შიდა navigation-იდან არ ილინკება.
- შენიშვნა: blog section უფრო სატესტო ან დაუსრულებელ ნაწილს ჰგავს.

### `/:locale/autoschools/:id`
- ფაილი: `src/app/[locale]/autoschools/[id]/page.tsx`
- სტატუსი: hidden / mock-based page
- მიზეზი: route არსებობს, მაგრამ პროექტში inbound link არ ჩანს.
- შენიშვნა: გვერდი `MOCK_SCHOOL` მონაცემებზეა აწყობილი.

### `/:locale/exam-monitor-logs`
- ფაილი: `src/app/[locale]/exam-monitor-logs/page.tsx`
- სტატუსი: hidden / temporary page
- მიზეზი: route არსებობს, მაგრამ navigation-იდან არ ჩანს.
- შენიშვნა: თვითონ ფაილში წერია `TEMPORARY PAGE — DELETE WHEN NO LONGER NEEDED`.

## Removed

### `/:locale/404`
- წაშლილია 2026-03-23
- მიზეზი: ცალკე route ზედმეტი იყო, რადგან პროექტში უკვე არსებობს `not-found.tsx` ფაილები Next.js-ის native 404 flow-სთვის.
