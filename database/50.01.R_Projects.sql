DELIMITER $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECTS $$
DROP PROCEDURE IF EXISTS R_FETCH_PROJECT_BY_ID $$
DROP PROCEDURE IF EXISTS R_CREATE_PROJECT $$
DROP PROCEDURE IF EXISTS R_UPDATE_PROJECT $$
DROP PROCEDURE IF EXISTS R_DELETE_PROJECT $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_LANGUAGES $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECT_KEYS $$
DROP PROCEDURE IF EXISTS R_FETCH_PROJECT_KEY_BY_ID $$
DROP PROCEDURE IF EXISTS R_FETCH_PROJECT_KEY_BY_PROJECT_SECTION $$
DROP PROCEDURE IF EXISTS R_CREATE_PROJECT_KEY $$
DROP PROCEDURE IF EXISTS R_UPDATE_PROJECT_KEY $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE $$
DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY $$
DROP PROCEDURE IF EXISTS R_FETCH_PROJECT_TRANSLATIONS_FOR_EXPORT $$

DROP PROCEDURE IF EXISTS R_CREATE_PROJECT_TRANSLATION $$

DROP PROCEDURE IF EXISTS R_IMPORT_TRANSLATION $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECT_SECTIONS $$
DROP PROCEDURE IF EXISTS R_CREATE_PROJECT_SECTION $$
DROP PROCEDURE IF EXISTS R_UPDATE_PROJECT_SECTION $$
DROP PROCEDURE IF EXISTS R_DELETE_PROJECT_SECTION $$

CREATE PROCEDURE R_FETCH_ALL_PROJECTS()
BEGIN
	SELECT 	*
	FROM 	T_PROJECTS
	ORDER 	BY name;
END $$

CREATE PROCEDURE R_FETCH_PROJECT_BY_ID(IN p_id BIGINT)
BEGIN
	SELECT 	*
	FROM 	T_PROJECTS
    WHERE 	id = p_id;
END $$

CREATE PROCEDURE R_CREATE_PROJECT(IN p_name VARCHAR(512), IN p_desc LONGTEXT)
BEGIN
	INSERT INTO T_PROJECTS(name, description)
    VALUES(p_name, p_desc);
    
    CALL R_FETCH_PROJECT_BY_ID(last_insert_id());
END $$ 

CREATE PROCEDURE R_UPDATE_PROJECT(IN p_id BIGINT, IN p_name VARCHAR(512), IN p_desc LONGTEXT)
BEGIN
	UPDATE 	T_PROJECTS
    SET 	name = p_name, description=p_desc
    WHERE 	id = p_id
    LIMIT 1;
    
    CALL R_FETCH_PROJECT_BY_ID(p_id);
END $$ 

CREATE PROCEDURE R_DELETE_PROJECT(IN p_id BIGINT)
BEGIN
	
    DELETE FROM T_PROJECT_TRANSLATIONS
    WHERE project_key_id IN (
		SELECT id FROM T_PROJECT_KEYS WHERE project_id = p_id
    );
    
    DELETE FROM T_PROJECT_KEYS WHERE project_id = p_id;
    
    DELETE FROM T_PROJECT_SECTIONS WHERE project_id = p_id;

	DELETE FROM T_PROJECTS WHERE id = p_id LIMIT 1;
    
	SELECT "OK";
END $$ 


CREATE PROCEDURE R_FETCH_ALL_LANGUAGES()
BEGIN
	SELECT 		*
	FROM 		T_LANGUAGES
	ORDER BY 	name;
END $$

CREATE PROCEDURE R_FETCH_ALL_PROJECT_KEYS(IN p_project_id BIGINT)
BEGIN
	SELECT	*
    FROM	T_PROJECT_KEYS
    WHERE 	project_id = p_project_id
	ORDER 	BY code;
END $$

CREATE PROCEDURE R_FETCH_PROJECT_KEY_BY_ID(IN p_key_id BIGINT)
BEGIN
	SELECT 	*
    FROM 	T_PROJECT_KEYS 
	WHERE 	id = p_key_id;
END $$

CREATE PROCEDURE R_FETCH_PROJECT_KEY_BY_PROJECT_SECTION(IN p_project_id BIGINT, IN p_section_id BIGINT)
BEGIN
	SELECT	*
    FROM 	T_PROJECT_KEYS
    WHERE	project_id = p_project_id 
			AND project_section_id = p_section_id
    ORDER 	BY code;
END $$

CREATE PROCEDURE R_CREATE_PROJECT_KEY(IN p_project_id BIGINT, IN p_name VARCHAR(255))
BEGIN
	INSERT INTO T_PROJECT_KEYS(project_id, code)
    VALUES(p_project_id, p_name)
	ON DUPLICATE KEY UPDATE code=p_name;
    
    CALL R_FETCH_PROJECT_KEY_BY_ID(last_insert_id());
END $$

CREATE PROCEDURE R_UPDATE_PROJECT_KEY(IN p_id BIGINT, IN p_project_id BIGINT, IN p_section_id BIGINT, IN p_name VARCHAR(255))
BEGIN
	UPDATE 	T_PROJECT_KEYS
    SET		code = p_name,
			project_section_id = p_section_id
	WHERE	id = p_id
			AND project_id = p_project_id
	LIMIT	1;
    
    SELECT "OK";
END $$

CREATE PROCEDURE R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE(IN p_project_id BIGINT, IN p_language_id BIGINT)
BEGIN
	SELECT 	l.id as language_id, k.id as project_key_id, k.code, t.value, l.iso_code, l.name as `language`
	FROM 	T_PROJECT_TRANSLATIONS t
			RIGHT JOIN (T_LANGUAGES l, T_PROJECT_KEYS k) ON (t.language_id = l.id AND t.project_key_id = k.id)
	WHERE 	k.project_id = p_project_id
			AND l.id = p_language_id
	ORDER 	BY k.code;
END $$

CREATE PROCEDURE R_FETCH_PROJECT_TRANSLATIONS_FOR_EXPORT(IN p_project_id BIGINT, IN p_language_id BIGINT, IN p_section_id BIGINT) 
BEGIN
	SELECT 	k.code, tpt.value original, t.value
	FROM 	T_PROJECT_TRANSLATIONS t
			RIGHT JOIN (T_LANGUAGES l, T_PROJECT_KEYS k) ON (t.language_id = l.id AND t.project_key_id = k.id)
			RIGHT JOIN (T_PROJECT_TRANSLATIONS tpt,  T_LANGUAGES tl) ON (tpt.project_key_id = k.id AND tpt.language_id = tl.id AND tl.iso_code='EN')
	WHERE 	k.project_id = p_project_id
			AND l.id = p_language_id
	ORDER 	BY k.code;
END $$


CREATE PROCEDURE R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY(IN p_project_id BIGINT, IN p_key_id BIGINT)
BEGIN
	SELECT 	l.id as language_id, k.id as project_key_id, k.code, t.value, l.iso_code, l.name as `language`
	FROM 	T_PROJECT_TRANSLATIONS t
			RIGHT JOIN (T_LANGUAGES l, T_PROJECT_KEYS k) ON (t.language_id = l.id AND t.project_key_id = k.id)
	WHERE 	k.project_id = p_project_id
			AND k.id = p_key_id
	ORDER 	BY l.name;
END $$

CREATE PROCEDURE R_CREATE_PROJECT_TRANSLATION(IN p_project_id BIGINT, IN p_key_id BIGINT, IN p_language_id BIGINT, IN p_value LONGTEXT)
BEGIN
	INSERT INTO T_PROJECT_TRANSLATIONS(project_key_id, language_id, `value`)
	VALUES(p_key_id, p_language_id, p_value)
    ON DUPLICATE KEY UPDATE `value` = p_value;
END $$


CREATE PROCEDURE R_IMPORT_TRANSLATION(IN p_project_id BIGINT, IN p_language_id BIGINT, IN p_name VARCHAR(255), IN p_value LONGTEXT)
BEGIN
	DECLARE v_project_id, v_language_id, v_project_key_id BIGINT;

	SELECT	id INTO v_language_id
    FROM	T_LANGUAGES
    WHERE	id = p_language_id
    LIMIT 	0,1;
    
    SELECT 	id INTO v_project_id
    FROM 	T_PROJECTS
    WHERE	id = p_project_id
    LIMIT	0,1;
    
    IF v_language_id IS NOT NULL AND v_project_id IS NOT NULL 
    THEN
		SELECT 	id INTO v_project_key_id
        FROM	T_PROJECT_KEYS
        WHERE	project_id = v_project_id
				AND upper(code) = upper(p_name)
		LIMIT 	0,1;
        
        -- CREATE PROJECT KEY IF NOT FOUND
        IF v_project_key_id IS NULL 
        THEN
			INSERT INTO T_PROJECT_KEYS(project_id, code)
			VALUES(v_project_id, p_name)
			ON DUPLICATE KEY UPDATE code=p_name;
        
			SET v_project_key_id = last_insert_id();
        END IF;
        
        INSERT INTO T_PROJECT_TRANSLATIONS(project_key_id, language_id, value)
        VALUES(v_project_key_id, v_language_id, p_value)
        ON DUPLICATE KEY UPDATE `value` = p_value;
    END IF;
END $$

CREATE PROCEDURE R_FETCH_ALL_PROJECT_SECTIONS(IN p_project_id BIGINT)
BEGIN
		SELECT 	ps.id, ps.name
        FROM	T_PROJECT_SECTIONS ps, T_PROJECTS p
        WHERE	p.id = p_project_id AND ps.project_id = p.id
        ORDER BY ps.name;
END $$

CREATE PROCEDURE R_CREATE_PROJECT_SECTION(IN p_project_id BIGINT, IN p_name VARCHAR(255))
BEGIN
	DECLARE v_project_id BIGINT;
    
    SELECT 	id INTO v_project_id
    FROM	T_PROJECTS
    WHERE	id = p_project_id;
    
    IF v_project_id IS NOT NULL 
    THEN
		INSERT INTO T_PROJECT_SECTIONS(project_id, name)
        VALUES(p_project_id, p_name);
        
        SELECT * FROM T_PROJECT_SECTIONS WHERE id = last_insert_id();
    END IF;
END $$

CREATE PROCEDURE R_UPDATE_PROJECT_SECTION(IN p_id BIGINT, IN p_project_id BIGINT, IN p_name VARCHAR(255))
BEGIN
	UPDATE 	T_PROJECT_SECTIONS
	SET		name = p_name
    WHERE	id = p_id AND project_id = p_project_id
    LIMIT	1;
    
    SELECT "OK";
END $$

CREATE PROCEDURE R_DELETE_PROJECT_SECTION(IN p_id BIGINT, IN p_project_id BIGINT)
BEGIN
	UPDATE 	T_PROJECT_KEYS
    SET		project_section_id = NULL
    WHERE	project_id = p_project_id AND project_section_id = p_id;
    
    DELETE 	
    FROM 	T_PROJECT_SECTIONS
    WHERE 	id = p_id 
			AND project_id = p_project_id
    LIMIT 	1;
    
    SELECT "OK";
END $$

DELIMITER ;