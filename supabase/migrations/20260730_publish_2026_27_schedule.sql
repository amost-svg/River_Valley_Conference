-- Publish the validated 2026-27 RVC master schedule.
-- Dates and opponents are authoritative; the source sheet does not contain
-- verified start times, so every imported contest displays Time TBA until an
-- athletic director updates the record.

create unique index if not exists games_external_import_key
on public.games(external_source, external_event_id)
where external_source is not null and external_event_id is not null;

with source_rows(
  source_row,
  sport_slug,
  game_date,
  away_school_slug,
  home_school_slug
) as (
  values
    (47, 'girls-volleyball', date '2026-09-03', 'gardner-south-wilmington', 'beecher'),
    (48, 'girls-volleyball', date '2026-09-03', 'donovan', 'grant-park'),
    (49, 'girls-volleyball', date '2026-09-03', 'st-anne', 'grace-christian-academy'),
    (50, 'girls-volleyball', date '2026-09-03', 'momence', 'tri-point'),
    (51, 'girls-volleyball', date '2026-09-03', 'illinois-lutheran', 'central'),
    (52, 'girls-volleyball', date '2026-09-08', 'grant-park', 'beecher'),
    (53, 'girls-volleyball', date '2026-09-08', 'central', 'gardner-south-wilmington'),
    (54, 'girls-volleyball', date '2026-09-08', 'tri-point', 'illinois-lutheran'),
    (55, 'girls-volleyball', date '2026-09-08', 'grace-christian-academy', 'momence'),
    (56, 'girls-volleyball', date '2026-09-08', 'donovan', 'st-anne'),
    (57, 'girls-volleyball', date '2026-09-10', 'tri-point', 'st-anne'),
    (58, 'girls-volleyball', date '2026-09-10', 'grace-christian-academy', 'donovan'),
    (59, 'girls-volleyball', date '2026-09-10', 'grant-park', 'gardner-south-wilmington'),
    (60, 'girls-volleyball', date '2026-09-10', 'beecher', 'illinois-lutheran'),
    (61, 'girls-volleyball', date '2026-09-10', 'central', 'momence'),
    (62, 'girls-volleyball', date '2026-09-15', 'st-anne', 'central'),
    (63, 'girls-volleyball', date '2026-09-15', 'momence', 'beecher'),
    (64, 'girls-volleyball', date '2026-09-15', 'illinois-lutheran', 'gardner-south-wilmington'),
    (65, 'girls-volleyball', date '2026-09-15', 'grace-christian-academy', 'grant-park'),
    (66, 'girls-volleyball', date '2026-09-15', 'donovan', 'tri-point'),
    (67, 'girls-volleyball', date '2026-09-17', 'gardner-south-wilmington', 'momence'),
    (68, 'girls-volleyball', date '2026-09-17', 'beecher', 'st-anne'),
    (69, 'girls-volleyball', date '2026-09-17', 'central', 'donovan'),
    (70, 'girls-volleyball', date '2026-09-17', 'tri-point', 'grace-christian-academy'),
    (71, 'girls-volleyball', date '2026-09-17', 'grant-park', 'illinois-lutheran'),
    (72, 'girls-volleyball', date '2026-09-22', 'tri-point', 'grant-park'),
    (73, 'girls-volleyball', date '2026-09-22', 'grace-christian-academy', 'central'),
    (74, 'girls-volleyball', date '2026-09-22', 'donovan', 'beecher'),
    (75, 'girls-volleyball', date '2026-09-22', 'st-anne', 'gardner-south-wilmington'),
    (76, 'girls-volleyball', date '2026-09-22', 'momence', 'illinois-lutheran'),
    (77, 'girls-volleyball', date '2026-09-24', 'grant-park', 'momence'),
    (78, 'girls-volleyball', date '2026-09-24', 'illinois-lutheran', 'st-anne'),
    (79, 'girls-volleyball', date '2026-09-24', 'gardner-south-wilmington', 'donovan'),
    (80, 'girls-volleyball', date '2026-09-24', 'beecher', 'grace-christian-academy'),
    (81, 'girls-volleyball', date '2026-09-24', 'central', 'tri-point'),
    (82, 'girls-volleyball', date '2026-09-29', 'st-anne', 'momence'),
    (83, 'girls-volleyball', date '2026-09-29', 'central', 'grant-park'),
    (84, 'girls-volleyball', date '2026-09-29', 'tri-point', 'beecher'),
    (85, 'girls-volleyball', date '2026-09-29', 'grace-christian-academy', 'gardner-south-wilmington'),
    (86, 'girls-volleyball', date '2026-09-29', 'donovan', 'illinois-lutheran'),
    (87, 'girls-volleyball', date '2026-10-01', 'gardner-south-wilmington', 'tri-point'),
    (88, 'girls-volleyball', date '2026-10-01', 'beecher', 'central'),
    (89, 'girls-volleyball', date '2026-10-01', 'grant-park', 'st-anne'),
    (90, 'girls-volleyball', date '2026-10-01', 'momence', 'donovan'),
    (91, 'girls-volleyball', date '2026-10-01', 'illinois-lutheran', 'grace-christian-academy'),
    (122, 'boys-soccer', date '2026-08-25', 'illinois-lutheran', 'central'),
    (123, 'boys-soccer', date '2026-08-25', 'beecher', 'momence'),
    (124, 'boys-soccer', date '2026-08-25', 'grant-park', 'st-anne'),
    (125, 'boys-soccer', date '2026-08-27', 'central', 'beecher'),
    (126, 'boys-soccer', date '2026-08-27', 'illinois-lutheran', 'grant-park'),
    (127, 'boys-soccer', date '2026-08-27', 'momence', 'st-anne'),
    (128, 'boys-soccer', date '2026-09-01', 'grant-park', 'central'),
    (129, 'boys-soccer', date '2026-09-01', 'st-anne', 'beecher'),
    (130, 'boys-soccer', date '2026-09-01', 'momence', 'illinois-lutheran'),
    (137, 'boys-soccer', date '2026-09-03', 'central', 'st-anne'),
    (138, 'boys-soccer', date '2026-09-03', 'grant-park', 'momence'),
    (139, 'boys-soccer', date '2026-09-03', 'beecher', 'illinois-lutheran'),
    (140, 'boys-soccer', date '2026-09-08', 'momence', 'central'),
    (141, 'boys-soccer', date '2026-09-08', 'illinois-lutheran', 'st-anne'),
    (142, 'boys-soccer', date '2026-09-08', 'beecher', 'grant-park'),
    (149, 'boys-soccer', date '2026-09-10', 'central', 'illinois-lutheran'),
    (150, 'boys-soccer', date '2026-09-10', 'momence', 'beecher'),
    (151, 'boys-soccer', date '2026-09-10', 'st-anne', 'grant-park'),
    (152, 'boys-soccer', date '2026-09-15', 'beecher', 'central'),
    (153, 'boys-soccer', date '2026-09-15', 'grant-park', 'illinois-lutheran'),
    (154, 'boys-soccer', date '2026-09-15', 'st-anne', 'momence'),
    (155, 'boys-soccer', date '2026-09-17', 'central', 'grant-park'),
    (156, 'boys-soccer', date '2026-09-17', 'beecher', 'st-anne'),
    (157, 'boys-soccer', date '2026-09-17', 'illinois-lutheran', 'momence'),
    (158, 'boys-soccer', date '2026-09-29', 'st-anne', 'central'),
    (159, 'boys-soccer', date '2026-09-29', 'momence', 'grant-park'),
    (160, 'boys-soccer', date '2026-09-29', 'illinois-lutheran', 'beecher'),
    (161, 'boys-soccer', date '2026-10-01', 'central', 'momence'),
    (162, 'boys-soccer', date '2026-10-01', 'st-anne', 'illinois-lutheran'),
    (163, 'boys-soccer', date '2026-10-01', 'grant-park', 'beecher'),
    (209, 'boys-basketball', date '2026-12-01', 'grant-park', 'beecher'),
    (210, 'boys-basketball', date '2026-12-01', 'central', 'gardner-south-wilmington'),
    (211, 'boys-basketball', date '2026-12-01', 'tri-point', 'illinois-lutheran'),
    (212, 'boys-basketball', date '2026-12-01', 'grace-christian-academy', 'momence'),
    (213, 'boys-basketball', date '2026-12-01', 'donovan', 'st-anne'),
    (214, 'boys-basketball', date '2026-12-04', 'gardner-south-wilmington', 'beecher'),
    (215, 'boys-basketball', date '2026-12-04', 'donovan', 'grant-park'),
    (216, 'boys-basketball', date '2026-12-04', 'st-anne', 'grace-christian-academy'),
    (217, 'boys-basketball', date '2026-12-04', 'momence', 'tri-point'),
    (218, 'boys-basketball', date '2026-12-04', 'illinois-lutheran', 'central'),
    (219, 'boys-basketball', date '2026-12-08', 'st-anne', 'momence'),
    (220, 'boys-basketball', date '2026-12-08', 'central', 'grant-park'),
    (221, 'boys-basketball', date '2026-12-08', 'tri-point', 'beecher'),
    (222, 'boys-basketball', date '2026-12-08', 'grace-christian-academy', 'gardner-south-wilmington'),
    (223, 'boys-basketball', date '2026-12-08', 'donovan', 'illinois-lutheran'),
    (224, 'boys-basketball', date '2026-12-15', 'tri-point', 'st-anne'),
    (225, 'boys-basketball', date '2026-12-15', 'grace-christian-academy', 'donovan'),
    (226, 'boys-basketball', date '2026-12-15', 'grant-park', 'gardner-south-wilmington'),
    (227, 'boys-basketball', date '2026-12-15', 'beecher', 'illinois-lutheran'),
    (228, 'boys-basketball', date '2026-12-15', 'central', 'momence'),
    (229, 'boys-basketball', date '2027-01-08', 'gardner-south-wilmington', 'momence'),
    (230, 'boys-basketball', date '2027-01-08', 'beecher', 'st-anne'),
    (231, 'boys-basketball', date '2027-01-08', 'central', 'donovan'),
    (232, 'boys-basketball', date '2027-01-08', 'tri-point', 'grace-christian-academy'),
    (233, 'boys-basketball', date '2027-01-08', 'grant-park', 'illinois-lutheran'),
    (234, 'boys-basketball', date '2027-01-12', 'tri-point', 'grant-park'),
    (235, 'boys-basketball', date '2027-01-12', 'grace-christian-academy', 'central'),
    (236, 'boys-basketball', date '2027-01-12', 'donovan', 'beecher'),
    (237, 'boys-basketball', date '2027-01-12', 'st-anne', 'gardner-south-wilmington'),
    (238, 'boys-basketball', date '2027-01-12', 'momence', 'illinois-lutheran'),
    (239, 'boys-basketball', date '2027-01-15', 'grant-park', 'momence'),
    (240, 'boys-basketball', date '2027-01-15', 'illinois-lutheran', 'st-anne'),
    (241, 'boys-basketball', date '2027-01-15', 'gardner-south-wilmington', 'donovan'),
    (242, 'boys-basketball', date '2027-01-15', 'beecher', 'grace-christian-academy'),
    (243, 'boys-basketball', date '2027-01-15', 'central', 'tri-point'),
    (244, 'boys-basketball', date '2027-01-22', 'gardner-south-wilmington', 'tri-point'),
    (245, 'boys-basketball', date '2027-01-22', 'beecher', 'central'),
    (246, 'boys-basketball', date '2027-01-22', 'grant-park', 'st-anne'),
    (247, 'boys-basketball', date '2027-01-22', 'momence', 'donovan'),
    (248, 'boys-basketball', date '2027-01-26', 'illinois-lutheran', 'grace-christian-academy'),
    (249, 'boys-basketball', date '2027-01-26', 'st-anne', 'central'),
    (250, 'boys-basketball', date '2027-01-26', 'momence', 'beecher'),
    (251, 'boys-basketball', date '2027-01-26', 'illinois-lutheran', 'gardner-south-wilmington'),
    (252, 'boys-basketball', date '2027-01-26', 'grace-christian-academy', 'grant-park'),
    (253, 'boys-basketball', date '2027-01-26', 'donovan', 'tri-point'),
    (344, 'girls-basketball', date '2026-11-17', 'central', 'beecher'),
    (346, 'girls-basketball', date '2026-11-17', 'grace-christian-academy', 'grant-park'),
    (347, 'girls-basketball', date '2026-11-17', 'momence', 'illinois-lutheran'),
    (349, 'girls-basketball', date '2026-11-20', 'donovan', 'gardner-south-wilmington'),
    (350, 'girls-basketball', date '2026-11-20', 'central', 'grant-park'),
    (352, 'girls-basketball', date '2026-11-20', 'grace-christian-academy', 'momence'),
    (354, 'girls-basketball', date '2026-11-30', 'illinois-lutheran', 'grace-christian-academy'),
    (356, 'girls-basketball', date '2026-11-30', 'gardner-south-wilmington', 'central'),
    (357, 'girls-basketball', date '2026-11-30', 'beecher', 'donovan'),
    (359, 'girls-basketball', date '2026-12-03', 'beecher', 'grant-park'),
    (360, 'girls-basketball', date '2026-12-03', 'donovan', 'illinois-lutheran'),
    (361, 'girls-basketball', date '2026-12-03', 'central', 'momence'),
    (365, 'girls-basketball', date '2026-12-07', 'illinois-lutheran', 'central'),
    (366, 'girls-basketball', date '2026-12-07', 'grant-park', 'donovan'),
    (367, 'girls-basketball', date '2026-12-07', 'gardner-south-wilmington', 'beecher'),
    (369, 'girls-basketball', date '2026-12-10', 'grant-park', 'momence'),
    (370, 'girls-basketball', date '2026-12-10', 'gardner-south-wilmington', 'grace-christian-academy'),
    (372, 'girls-basketball', date '2026-12-10', 'donovan', 'central'),
    (374, 'girls-basketball', date '2026-12-14', 'gardner-south-wilmington', 'illinois-lutheran'),
    (375, 'girls-basketball', date '2026-12-14', 'beecher', 'momence'),
    (376, 'girls-basketball', date '2026-12-14', 'donovan', 'grace-christian-academy'),
    (379, 'girls-basketball', date '2026-12-17', 'grace-christian-academy', 'central'),
    (380, 'girls-basketball', date '2026-12-17', 'momence', 'donovan'),
    (381, 'girls-basketball', date '2026-12-17', 'illinois-lutheran', 'beecher'),
    (382, 'girls-basketball', date '2026-12-17', 'grant-park', 'gardner-south-wilmington'),
    (385, 'girls-basketball', date '2026-12-21', 'grace-christian-academy', 'beecher'),
    (386, 'girls-basketball', date '2026-12-21', 'momence', 'gardner-south-wilmington'),
    (387, 'girls-basketball', date '2026-12-21', 'illinois-lutheran', 'grant-park'),
    (389, 'girls-basketball', date '2027-01-07', 'beecher', 'central'),
    (391, 'girls-basketball', date '2027-01-07', 'grant-park', 'grace-christian-academy'),
    (392, 'girls-basketball', date '2027-01-07', 'illinois-lutheran', 'momence'),
    (395, 'girls-basketball', date '2027-01-11', 'beecher', 'grace-christian-academy'),
    (396, 'girls-basketball', date '2027-01-11', 'gardner-south-wilmington', 'momence'),
    (397, 'girls-basketball', date '2027-01-11', 'grant-park', 'illinois-lutheran'),
    (399, 'girls-basketball', date '2027-01-14', 'momence', 'grant-park'),
    (400, 'girls-basketball', date '2027-01-14', 'grace-christian-academy', 'gardner-south-wilmington'),
    (402, 'girls-basketball', date '2027-01-14', 'central', 'donovan'),
    (404, 'girls-basketball', date '2027-01-19', 'gardner-south-wilmington', 'donovan'),
    (405, 'girls-basketball', date '2027-01-19', 'grant-park', 'central'),
    (407, 'girls-basketball', date '2027-01-19', 'momence', 'grace-christian-academy'),
    (409, 'girls-basketball', date '2027-01-21', 'grace-christian-academy', 'illinois-lutheran'),
    (411, 'girls-basketball', date '2027-01-21', 'central', 'gardner-south-wilmington'),
    (412, 'girls-basketball', date '2027-01-21', 'donovan', 'beecher'),
    (414, 'girls-basketball', date '2027-02-01', 'grant-park', 'beecher'),
    (415, 'girls-basketball', date '2027-02-01', 'illinois-lutheran', 'donovan'),
    (416, 'girls-basketball', date '2027-02-01', 'momence', 'central'),
    (419, 'girls-basketball', date '2027-02-04', 'central', 'grace-christian-academy'),
    (420, 'girls-basketball', date '2027-02-04', 'donovan', 'momence'),
    (421, 'girls-basketball', date '2027-02-04', 'beecher', 'illinois-lutheran'),
    (422, 'girls-basketball', date '2027-02-04', 'gardner-south-wilmington', 'grant-park'),
    (480, 'baseball', date '2027-03-30', 'donovan', 'momence'),
    (481, 'baseball', date '2027-03-30', 'st-anne', 'grant-park'),
    (482, 'baseball', date '2027-03-30', 'illinois-lutheran', 'central'),
    (483, 'baseball', date '2027-03-30', 'beecher', 'gardner-south-wilmington'),
    (484, 'baseball', date '2027-04-01', 'momence', 'donovan'),
    (485, 'baseball', date '2027-04-01', 'grant-park', 'st-anne'),
    (486, 'baseball', date '2027-04-01', 'central', 'illinois-lutheran'),
    (487, 'baseball', date '2027-04-01', 'gardner-south-wilmington', 'beecher'),
    (488, 'baseball', date '2027-04-06', 'illinois-lutheran', 'momence'),
    (489, 'baseball', date '2027-04-06', 'beecher', 'st-anne'),
    (490, 'baseball', date '2027-04-06', 'gardner-south-wilmington', 'donovan'),
    (491, 'baseball', date '2027-04-06', 'central', 'grant-park'),
    (492, 'baseball', date '2027-04-08', 'momence', 'illinois-lutheran'),
    (493, 'baseball', date '2027-04-08', 'st-anne', 'beecher'),
    (494, 'baseball', date '2027-04-08', 'donovan', 'gardner-south-wilmington'),
    (495, 'baseball', date '2027-04-08', 'grant-park', 'central'),
    (496, 'baseball', date '2027-04-13', 'gardner-south-wilmington', 'momence'),
    (497, 'baseball', date '2027-04-13', 'central', 'beecher'),
    (498, 'baseball', date '2027-04-13', 'grant-park', 'illinois-lutheran'),
    (499, 'baseball', date '2027-04-13', 'donovan', 'st-anne'),
    (500, 'baseball', date '2027-04-15', 'momence', 'gardner-south-wilmington'),
    (501, 'baseball', date '2027-04-15', 'beecher', 'central'),
    (502, 'baseball', date '2027-04-15', 'illinois-lutheran', 'grant-park'),
    (503, 'baseball', date '2027-04-15', 'st-anne', 'donovan'),
    (504, 'baseball', date '2027-04-20', 'grant-park', 'momence'),
    (505, 'baseball', date '2027-04-20', 'donovan', 'central'),
    (506, 'baseball', date '2027-04-20', 'st-anne', 'gardner-south-wilmington'),
    (507, 'baseball', date '2027-04-20', 'illinois-lutheran', 'beecher'),
    (508, 'baseball', date '2027-04-22', 'momence', 'grant-park'),
    (509, 'baseball', date '2027-04-22', 'central', 'donovan'),
    (510, 'baseball', date '2027-04-22', 'gardner-south-wilmington', 'st-anne'),
    (511, 'baseball', date '2027-04-22', 'beecher', 'illinois-lutheran'),
    (512, 'baseball', date '2027-04-27', 'st-anne', 'momence'),
    (513, 'baseball', date '2027-04-27', 'illinois-lutheran', 'donovan'),
    (514, 'baseball', date '2027-04-27', 'beecher', 'grant-park'),
    (515, 'baseball', date '2027-04-27', 'gardner-south-wilmington', 'central'),
    (516, 'baseball', date '2027-04-29', 'momence', 'st-anne'),
    (517, 'baseball', date '2027-04-29', 'donovan', 'illinois-lutheran'),
    (518, 'baseball', date '2027-04-29', 'grant-park', 'beecher'),
    (519, 'baseball', date '2027-04-29', 'central', 'gardner-south-wilmington'),
    (520, 'baseball', date '2027-05-03', 'central', 'momence'),
    (521, 'baseball', date '2027-05-03', 'grant-park', 'gardner-south-wilmington'),
    (522, 'baseball', date '2027-05-03', 'donovan', 'beecher'),
    (523, 'baseball', date '2027-05-03', 'st-anne', 'illinois-lutheran'),
    (524, 'baseball', date '2027-05-06', 'momence', 'central'),
    (525, 'baseball', date '2027-05-06', 'gardner-south-wilmington', 'grant-park'),
    (526, 'baseball', date '2027-05-06', 'beecher', 'donovan'),
    (527, 'baseball', date '2027-05-06', 'illinois-lutheran', 'st-anne'),
    (528, 'baseball', date '2027-05-11', 'beecher', 'momence'),
    (529, 'baseball', date '2027-05-11', 'gardner-south-wilmington', 'illinois-lutheran'),
    (530, 'baseball', date '2027-05-11', 'central', 'st-anne'),
    (531, 'baseball', date '2027-05-11', 'grant-park', 'donovan'),
    (532, 'baseball', date '2027-05-13', 'momence', 'beecher'),
    (533, 'baseball', date '2027-05-13', 'illinois-lutheran', 'gardner-south-wilmington'),
    (534, 'baseball', date '2027-05-13', 'st-anne', 'central'),
    (535, 'baseball', date '2027-05-13', 'donovan', 'grant-park'),
    (592, 'softball', date '2027-03-30', 'donovan', 'momence'),
    (593, 'softball', date '2027-03-30', 'st-anne', 'grant-park'),
    (594, 'softball', date '2027-03-30', 'illinois-lutheran', 'central'),
    (595, 'softball', date '2027-03-30', 'beecher', 'gardner-south-wilmington'),
    (596, 'softball', date '2027-04-01', 'momence', 'donovan'),
    (597, 'softball', date '2027-04-01', 'grant-park', 'st-anne'),
    (598, 'softball', date '2027-04-01', 'central', 'illinois-lutheran'),
    (599, 'softball', date '2027-04-01', 'gardner-south-wilmington', 'beecher'),
    (600, 'softball', date '2027-04-06', 'illinois-lutheran', 'momence'),
    (601, 'softball', date '2027-04-06', 'beecher', 'st-anne'),
    (602, 'softball', date '2027-04-06', 'gardner-south-wilmington', 'donovan'),
    (603, 'softball', date '2027-04-06', 'central', 'grant-park'),
    (604, 'softball', date '2027-04-08', 'momence', 'illinois-lutheran'),
    (605, 'softball', date '2027-04-08', 'st-anne', 'beecher'),
    (606, 'softball', date '2027-04-08', 'donovan', 'gardner-south-wilmington'),
    (607, 'softball', date '2027-04-08', 'grant-park', 'central'),
    (608, 'softball', date '2027-04-13', 'gardner-south-wilmington', 'momence'),
    (609, 'softball', date '2027-04-13', 'central', 'beecher'),
    (610, 'softball', date '2027-04-13', 'grant-park', 'illinois-lutheran'),
    (611, 'softball', date '2027-04-13', 'donovan', 'st-anne'),
    (612, 'softball', date '2027-04-15', 'momence', 'gardner-south-wilmington'),
    (613, 'softball', date '2027-04-15', 'beecher', 'central'),
    (614, 'softball', date '2027-04-15', 'illinois-lutheran', 'grant-park'),
    (615, 'softball', date '2027-04-15', 'st-anne', 'donovan'),
    (616, 'softball', date '2027-04-20', 'grant-park', 'momence'),
    (617, 'softball', date '2027-04-20', 'donovan', 'central'),
    (618, 'softball', date '2027-04-20', 'st-anne', 'gardner-south-wilmington'),
    (619, 'softball', date '2027-04-20', 'illinois-lutheran', 'beecher'),
    (620, 'softball', date '2027-04-22', 'momence', 'grant-park'),
    (621, 'softball', date '2027-04-22', 'central', 'donovan'),
    (622, 'softball', date '2027-04-22', 'gardner-south-wilmington', 'st-anne'),
    (623, 'softball', date '2027-04-22', 'beecher', 'illinois-lutheran'),
    (624, 'softball', date '2027-04-27', 'st-anne', 'momence'),
    (625, 'softball', date '2027-04-27', 'illinois-lutheran', 'donovan'),
    (626, 'softball', date '2027-04-27', 'beecher', 'grant-park'),
    (627, 'softball', date '2027-04-27', 'gardner-south-wilmington', 'central'),
    (628, 'softball', date '2027-04-29', 'momence', 'st-anne'),
    (629, 'softball', date '2027-04-29', 'donovan', 'illinois-lutheran'),
    (630, 'softball', date '2027-04-29', 'grant-park', 'beecher'),
    (631, 'softball', date '2027-04-29', 'central', 'gardner-south-wilmington'),
    (632, 'softball', date '2027-05-03', 'central', 'momence'),
    (633, 'softball', date '2027-05-03', 'grant-park', 'gardner-south-wilmington'),
    (634, 'softball', date '2027-05-03', 'donovan', 'beecher'),
    (635, 'softball', date '2027-05-03', 'st-anne', 'illinois-lutheran'),
    (636, 'softball', date '2027-05-06', 'momence', 'central'),
    (637, 'softball', date '2027-05-06', 'gardner-south-wilmington', 'grant-park'),
    (638, 'softball', date '2027-05-06', 'beecher', 'donovan'),
    (639, 'softball', date '2027-05-06', 'illinois-lutheran', 'st-anne'),
    (640, 'softball', date '2027-05-11', 'beecher', 'momence'),
    (641, 'softball', date '2027-05-11', 'gardner-south-wilmington', 'illinois-lutheran'),
    (642, 'softball', date '2027-05-11', 'central', 'st-anne'),
    (643, 'softball', date '2027-05-11', 'grant-park', 'donovan'),
    (644, 'softball', date '2027-05-13', 'momence', 'beecher'),
    (645, 'softball', date '2027-05-13', 'illinois-lutheran', 'gardner-south-wilmington'),
    (646, 'softball', date '2027-05-13', 'st-anne', 'central'),
    (647, 'softball', date '2027-05-13', 'donovan', 'grant-park')
),
resolved as (
  select
    source_rows.*,
    season.id as season_id,
    sport.id as sport_id,
    away_school.id as away_school_id,
    home_school.id as home_school_id,
    away_team.id as away_team_id,
    home_team.id as home_team_id,
    home_school.short_name as home_short_name
  from source_rows
  join public.seasons season
    on season.name = '2026-27'
  join public.sports sport
    on sport.slug = source_rows.sport_slug
  join public.schools away_school
    on away_school.slug = source_rows.away_school_slug
  join public.schools home_school
    on home_school.slug = source_rows.home_school_slug
  join public.teams away_team
    on away_team.season_id = season.id
   and away_team.sport_id = sport.id
   and away_team.school_id = away_school.id
   and away_team.level = 'Varsity'
   and away_team.is_active
  join public.teams home_team
    on home_team.season_id = season.id
   and home_team.sport_id = sport.id
   and home_team.school_id = home_school.id
   and home_team.level = 'Varsity'
   and home_team.is_active
)
insert into public.games(
  season_id,
  sport_id,
  level,
  home_team_id,
  away_team_id,
  starts_at,
  timezone,
  location_text,
  is_conference,
  status,
  is_published,
  notes,
  external_source,
  external_event_id,
  owner_school_id
)
select
  resolved.season_id,
  resolved.sport_id,
  'Varsity',
  resolved.home_team_id,
  resolved.away_team_id,
  (resolved.game_date + time '18:00') at time zone 'America/Chicago',
  'America/Chicago',
  case
    when resolved.sport_slug = 'girls-basketball'
     and resolved.home_school_slug = 'gardner-south-wilmington'
      then 'Tri-Point/GSW — host site TBA'
    else coalesce(resolved.home_short_name, 'Home school')
  end,
  true,
  'scheduled',
  true,
  'Imported from Importable RVC Master row ' || resolved.source_row::text
    || '. Start time requires school verification.',
  'Importable RVC Master',
  'row-' || resolved.source_row::text,
  resolved.home_school_id
from resolved
on conflict (external_source, external_event_id)
where external_source is not null and external_event_id is not null
do nothing;

do $$
declare
  imported_count integer;
begin
  select count(*)
  into imported_count
  from public.games g
  join public.seasons s on s.id = g.season_id
  where s.name = '2026-27'
    and g.external_source = 'Importable RVC Master';

  if imported_count <> 282 then
    raise exception 'Expected 282 validated RVC master-schedule games, found %.', imported_count;
  end if;
end;
$$;

do $$
declare
  active_season_id uuid;
  sport_record record;
begin
  select id into strict active_season_id
  from public.seasons
  where name = '2026-27';

  for sport_record in
    select distinct sport_id
    from public.games
    where season_id = active_season_id
      and external_source = 'Importable RVC Master'
  loop
    perform private.recalculate_standings_impl(
      active_season_id,
      sport_record.sport_id
    );
  end loop;
end;
$$;
