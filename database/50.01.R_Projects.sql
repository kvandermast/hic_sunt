DELIMITER $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECTS $$
DROP PROCEDURE IF EXISTS R_FETCH_PROJECT_BY_ID $$
DROP PROCEDURE IF EXISTS R_CREATE_PROJECT $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_LANGUAGES $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECT_KEYS $$
DROP PROCEDURE IF EXISTS R_FETCH_PROJECT_KEY_BY_ID $$
DROP PROCEDURE IF EXISTS R_CREATE_PROJECT_KEY $$

DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_LANGUAGE $$
DROP PROCEDURE IF EXISTS R_FETCH_ALL_PROJECT_TRANSLATIONS_BY_KEY $$

DROP PROCEDURE IF EXISTS R_CREATE_PROJECT_TRANSLATION $$

DROP PROCEDURE IF EXISTS R_IMPORT_TRANSLATION $$

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

CREATE PROCEDURE R_CREATE_PROJECT_KEY(IN p_project_id BIGINT, IN p_name VARCHAR(255))
BEGIN
	INSERT INTO T_PROJECT_KEYS(project_id, code)
    VALUES(p_project_id, p_name)
	ON DUPLICATE KEY UPDATE code=p_name;
    
    CALL R_FETCH_PROJECT_KEY_BY_ID(last_insert_id());
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

DELIMITER ;