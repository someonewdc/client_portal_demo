-- Overlay D-054 kind-distinct tables. The previous migration copied request.specLines onto every file.
DELETE FROM "RequestFileSpecLine" AS line
USING "RequestFile" AS file
WHERE line."fileId" = file."id"
  AND file."fileName" IN (
    'Опросный-лист-З-10043.pdf',
    'Опросный-лист-З-10044.pdf',
    'КП-З-10044.pdf',
    'Опросный-лист-З-10046.pdf',
    'КП-З-10046.pdf',
    'Счёт-З-10046.pdf'
  );

INSERT INTO "RequestFileSpecLine" ("id", "fileId", "position", "name", "quantity", "unit", "comment", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    f."id",
    v.position,
    v.name,
    v.quantity,
    v.unit,
    v.comment,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "RequestFile" f
INNER JOIN (
    VALUES
        ('Опросный-лист-З-10043.pdf'::text, 0, 'ВРУ 400 А'::text, 1, 'шт'::text, 'опросный лист'::text),
        ('Опросный-лист-З-10043.pdf', 1, 'Учёт на вводе', 1, 'шт', NULL),
        ('Опросный-лист-З-10044.pdf', 0, 'Щит управления теплицами', 1, 'шт', 'IP54'),
        ('Опросный-лист-З-10044.pdf', 1, 'Частотники полива', 3, 'шт', NULL),
        ('КП-З-10044.pdf', 0, 'Щит управления теплицами', 1, 'комплект', NULL),
        ('КП-З-10044.pdf', 1, 'Шкаф частотников', 1, 'шт', NULL),
        ('КП-З-10044.pdf', 2, 'Пульт диспетчера', 1, 'шт', NULL),
        ('Опросный-лист-З-10046.pdf', 0, 'Щит ЩО-70 800 А IP54', 1, 'шт', 'навесной'),
        ('Опросный-лист-З-10046.pdf', 1, 'АВР на вводе', 1, 'комплект', NULL),
        ('КП-З-10046.pdf', 0, 'Щит ЩО-70 800 А IP54', 1, 'шт', NULL),
        ('КП-З-10046.pdf', 1, 'Комплект автоматики ввода', 1, 'шт', NULL),
        ('КП-З-10046.pdf', 2, 'Рубильник ввода', 1, 'шт', NULL),
        ('Счёт-З-10046.pdf', 0, 'Щит ЩО-70 800 А IP54', 1, 'шт', 'к оплате, показ'),
        ('Счёт-З-10046.pdf', 1, 'Комплект автоматики ввода', 1, 'шт', NULL)
) AS v("fileName", position, name, quantity, unit, comment)
    ON v."fileName" = f."fileName";
