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

