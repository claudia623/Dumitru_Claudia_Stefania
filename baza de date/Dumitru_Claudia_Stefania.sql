create table categorii
(
    id_categorie   int auto_increment
        primary key,
    nume_categorie varchar(50) not null,
    constraint nume_categorie
        unique (nume_categorie)
);

create table produse
(
    id_produs     int auto_increment
        primary key,
    nume_produs   varchar(100)           not null,
    descriere     text                   null,
    pret          decimal(10, 2)         not null,
    stoc          int  default 0         not null,
    id_categorie  int                    null,
    imagine       varchar(255)           null,
    data_adaugare date default curdate() not null,
    constraint produse_ibfk_1
        foreign key (id_categorie) references categorii (id_categorie)
);

create index id_categorie
    on produse (id_categorie);

create table utilizatori
(
    id_utilizator     int auto_increment
        primary key,
    nume_utilizator   varchar(100)             not null,
    email             varchar(100)             not null,
    username          varchar(50)              not null,
    parola            varchar(255)             not null,
    rol               enum ('client', 'admin') not null,
    data_inregistrare date default curdate()   not null,
    constraint email
        unique (email),
    constraint username
        unique (username)
);

create table comenzi
(
    id_comanda    int auto_increment
        primary key,
    id_utilizator int                                                                not null,
    data_comanda  date                                        default curdate()      not null,
    status        enum ('in procesare', 'livrata', 'anulata') default 'in procesare' null,
    total         decimal(10, 2)                                                     null,
    constraint comenzi_ibfk_1
        foreign key (id_utilizator) references utilizatori (id_utilizator)
);

create index id_utilizator
    on comenzi (id_utilizator);

create table cos_cumparaturi
(
    id_cos        int auto_increment
        primary key,
    id_utilizator int                    not null,
    id_produs     int                    not null,
    cantitate     int  default 1         not null,
    data_adaugare date default curdate() not null,
    constraint cos_cumparaturi_ibfk_1
        foreign key (id_utilizator) references utilizatori (id_utilizator),
    constraint cos_cumparaturi_ibfk_2
        foreign key (id_produs) references produse (id_produs)
);

create index id_produs
    on cos_cumparaturi (id_produs);

create index id_utilizator
    on cos_cumparaturi (id_utilizator);

create table detalii_comanda
(
    id_detaliu  int auto_increment
        primary key,
    id_comanda  int            not null,
    id_produs   int            not null,
    cantitate   int            not null,
    pret_unitar decimal(10, 2) not null,
    constraint detalii_comanda_ibfk_1
        foreign key (id_comanda) references comenzi (id_comanda),
    constraint detalii_comanda_ibfk_2
        foreign key (id_produs) references produse (id_produs)
);

create index id_comanda
    on detalii_comanda (id_comanda);

create index id_produs
    on detalii_comanda (id_produs);

create table recenzii
(
    id_recenzie   int auto_increment
        primary key,
    id_utilizator int                    not null,
    id_produs     int                    not null,
    comentariu    text                   null,
    rating        int                    null
        check (`rating` between 1 and 5),
    data          date default curdate() not null,
    constraint recenzii_ibfk_1
        foreign key (id_utilizator) references utilizatori (id_utilizator),
    constraint recenzii_ibfk_2
        foreign key (id_produs) references produse (id_produs)
);

create index id_utilizator
    on recenzii (id_utilizator);

create index idx_recenzii_id_produs
    on recenzii (id_produs);

create
    definer = root@`%` procedure actualizeaza_stoc_produs(IN p_id_produs int, IN p_cantitate int)
BEGIN
  UPDATE produse
  SET stoc = stoc + p_cantitate
  WHERE id_produs = p_id_produs;
END;

create
    definer = root@`%` procedure afiseaza_comenzi_utilizator(IN user_nume varchar(50))
BEGIN
  SELECT c.id_comanda, c.data_comanda, c.status, c.total
  FROM comenzi c
  JOIN utilizatori u ON c.id_utilizator = u.id_utilizator
  WHERE u.username = user_nume
  ORDER BY c.data_comanda DESC;
END;

create
    definer = root@`%` procedure populeaza_comenzi()
BEGIN
  DECLARE i INT DEFAULT 1;
  WHILE i <= 50 DO
    INSERT INTO comenzi (id_utilizator, status, total)
    VALUES (
      FLOOR(RAND() * 50 + 1),
      ELT(FLOOR(RAND() * 3 + 1), 'in procesare', 'livrata', 'anulata'),
      ROUND(RAND() * 300 + 50, 2)
    );
    SET i = i + 1;
  END WHILE;
END;

create
    definer = root@`%` procedure populeaza_cos()
BEGIN
  DECLARE i INT DEFAULT 1;
  WHILE i <= 50 DO
    INSERT INTO cos_cumparaturi (id_utilizator, id_produs, cantitate)
    VALUES (
      FLOOR(RAND() * 50 + 1),
      FLOOR(RAND() * 50 + 1),
      FLOOR(RAND() * 3 + 1)
    );
    SET i = i + 1;
  END WHILE;
END;

create
    definer = root@`%` procedure populeaza_detalii_comanda()
BEGIN
  DECLARE i INT DEFAULT 1;
  WHILE i <= 50 DO
    INSERT INTO detalii_comanda (id_comanda, id_produs, cantitate, pret_unitar)
    VALUES (
      FLOOR(RAND() * 50 + 1),
      FLOOR(RAND() * 50 + 1),
      FLOOR(RAND() * 5 + 1),
      ROUND(RAND() * 100 + 20, 2)
    );
    SET i = i + 1;
  END WHILE;
END;

create
    definer = root@`%` procedure populeaza_produse()
BEGIN
  DECLARE i INT DEFAULT 1;
  WHILE i <= 50 DO
    INSERT INTO produse (nume_produs, descriere, pret, stoc, id_categorie, imagine)
    VALUES (
      CONCAT('Plus Crosetat ', i),
      CONCAT('Descriere produs crosetat nr. ', i),
      ROUND(RAND() * 100 + 20, 2),
      FLOOR(RAND() * 20 + 1),
      FLOOR(RAND() * 5 + 1),
      CONCAT('imagine', i, '.jpg')
    );
    SET i = i + 1;
  END WHILE;
END;

create
    definer = root@`%` procedure populeaza_recenzii()
BEGIN
  DECLARE i INT DEFAULT 1;
  WHILE i <= 50 DO
    INSERT INTO recenzii (id_utilizator, id_produs, comentariu, rating)
    VALUES (
      FLOOR(RAND() * 50 + 1),
      FLOOR(RAND() * 50 + 1),
      CONCAT('Foarte drăguț produsul ', i),
      FLOOR(RAND() * 5 + 1)
    );
    SET i = i + 1;
  END WHILE;
END;

create
    definer = root@`%` procedure populeaza_utilizatori()
BEGIN
  DECLARE i INT DEFAULT 1;
  WHILE i <= 50 DO
    INSERT INTO utilizatori (nume_utilizator, email, username, parola, rol)
    VALUES (
      CONCAT('Utilizator', i),
      CONCAT('user', i, '@exemplu.com'),
      CONCAT('user', i),
      SHA2(CONCAT('parola', i), 256),
      'client'
    );
    SET i = i + 1;
  END WHILE;
END;

