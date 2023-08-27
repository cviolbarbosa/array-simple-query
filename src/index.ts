import * as loadsh from 'lodash';

function getNestedValue(obj: any, nestedField:any, value = null): any {
    try {
        if (typeof nestedField === 'string') {
            return getNestedValue(obj, nestedField.split('.'), value);
        } else if (nestedField.length === 1 && value !== null) {
            return obj[nestedField[0]] = value;
                } else if (nestedField.length === 0) {
            return obj;
                } else {
            return getNestedValue(obj[nestedField[0]], nestedField.slice(1), value);
                }

    } catch (error) {
        return null;
    }

}


/**
 * This method retrieves the first object that matches the input query.  It accepts nested queries.
 * It returns the original object.
 * In case no match is found, it returns `null`.
 *
 * @category 1-RETRIEVE
 * @param {*} arrObj An array of objects.
 * @param {*} query A key-value object representing the query. Use "." for nested queries ({"parent.child": "value"}) and "!" for negation ({"!field": "value"}).. 
 * @returns {*} Returns the matched object.
 * @see {@link filterObjects} 
 * @example
 * ```
 * const books = [
 * {'id':1,'title':'English course','author':{first_name:'Joe',last_name:'Doe'},'year':2009},
 * {'id':2,'title':'Italian course','author':{first_name:'Pico',last_name:'Pallino'},'year':2010},
 * {'id':3,'title':'German course','author':{first_name:'Max',last_name:'Musterman'},'year':2009}
 * ]
 * 
 * const englishBook =  getObject(books, {'title':'English course'});
 * const italianBook =  getObject(books, {'!title':'English course'});
 * const pallinosBook = getObject(books, {'author.last_name':'Pallino'});
 * 
 * ```
 */
    export function  getObject(arrObj: Array<any>, query: any): any {
        if (!arrObj) { return null; }
        const arrResult = filterObjects(arrObj, query, true);
        if (arrResult && arrResult.length) {
            return arrResult[0];
        } else {
            return null;
        }
    }


/**
 * This method returns a new object array composed of elements whose id numbers are found in a given list.
 * The new object array will have the same order as in the id list.
 * In case no match is found, it returns an empty array.
 *
 *
 * @category 1-RETRIEVE
 * @param {*} arrObj An array of objects.
 * @param {*} listIds An array of the selected id numbers.
 * @returns {*} Returns an array of matched ids.
 * @see {@link getObject}
 * @example
 * ```
 * const books = [
 * {'id':1,'title':'English course','author':{first_name:'Joe',last_name:'Doe'},'year':2009},
 * {'id':2,'title':'Italian course','author':{first_name:'Pico',last_name:'Pallino'},'year':2010},
 * {'id':3,'title':'German course','author':{first_name:'Max',last_name:'Musterman'},'year':2009}
 * ]
 * 
 * const selectedBooks = getObject(books,[1,2]);
 * console.log(selectedBooks)
 * // => [{ 'id': 1, 'title': 'English course', 'author': {first_name: 'Joe', last_name:'Doe'} },
 * //    { 'id': 2, 'title': 'Italian course', 'author': {first_name: ' Pico', last_name:'Pallino'} }]'
 * ```
 * 
 */
    export function  getObjectbyIds(arrObj: Array<any>, listIds: Array<number>): any[] {
        const foundObjs: any[] = [];
        let match = null;
        listIds.forEach((id) => {
            match = getObject(arrObj, { id: id });
            if (match) {
                foundObjs.push(match);
            }
        });

        return foundObjs;
    }




/**
 * This method returns a new array composed of all elements that match the query. It accepts nested queries.
 * In case no match is found, it returns an empty array.
 *
 * @category 1-RETRIEVE
 * @param {*} arrObj An array of objects.
 * @param {*} query A key-value object representing the query. Use "." for nested queries ({"parent.child": "value"}) and "!" for negation ({"!field": "value"}).
 * @returns {*} Returns an array of matched object.
 * @see {@link  getObject} {@link getObjectbyIds} 
 * @example
 * ```
 * const books = [
 * {'id':1,'title':'English course','author':{first_name:'Joe',last_name:'Doe'},'year':2009},
 * {'id':2,'title':'Italian course','author':{first_name:'Pico',last_name:'Pallino'},'year':2010},
 * {'id':3,'title':'German course','author':{first_name:'Max',last_name:'Musterman'},'year':2009}
 * ]
 * 
 * const selectedBooks = filterObjects(books,{'!title': 'German course'});
 * 
 * console.log(selectedBooks)
 * // => [{ 'id': 1, 'title': 'English course', 'author': {first_name: 'Joe', last_name:'Doe'} },
 * //    { 'id': 2, 'title': 'Italian course', 'author': {first_name: ' Pico', last_name:'Pallino'} }]'
 * ```
 * 
 */
    export function  filterObjects(arrObj: Array<any>, query: any, firstMatch= false): any[] {
        if (!arrObj) { return null; }
        let negation: boolean = false;
        const reverseIndex: Array<number> = [];
        const matchObjects: Array<any> = [];
        if (arrObj.length > 0) {
            for (let index = 0; index < arrObj.length; index++) {
                const obj = arrObj[index];
                let match = true;
                for (let fieldName in query) {
                    if (query.hasOwnProperty(fieldName)) {
                    let aux: boolean;
                    const queryValue = query[fieldName];

                    if (fieldName.charAt(0) === '!') {
                        negation = true;
                        fieldName = fieldName.substr(1);
                    }

                    // Reproduces the Django .objects.get() behaviour
                    let objValue = loadsh.cloneDeep(getNestedValue(obj, fieldName));

                    if (fieldName === 'id') {
                        if (objValue && objValue.hasOwnProperty('id')) {
                            objValue = objValue.id;
                        }
                    }

                    if (Array.isArray(objValue)) {
                        aux = (objValue.indexOf(queryValue) > -1);
                    } else {
                        // tslint:disable-next-line:triple-equals
                        if (queryValue === 'not_null') { aux = !!(objValue); } else { aux = (objValue == queryValue); }
                    }

                    if (negation) { aux = !aux; }

                    match = match && aux;
                }}
                if (match) {
                    matchObjects.push(obj);
                    if (firstMatch) {continue; }
                }
            }
        }
        return matchObjects;
    }




/**
 * This method updates an element chosen by its id inside the input array. Each object must have an 'id' key.
 * It returns 'true' if the update is successfull.
 *
 * @category 3-UPDATE
 * @param {*} arrObj An array of objects.
 * @param {*} id Unique string or number that identifies the object.
 * @param {*} patch a partial object containing the fields and values to be updated.
 * @returns {*} Returns an array of matched object.
 * @see {@link  getObject} {@link getObjectbyIds}  
 * @example
 * ```
 * const books = [
 * {'id':1,'title':'English course','author':{first_name:'Joe',last_name:'Doe'},'year':2009},
 * {'id':2,'title':'Italian course','author':{first_name:'Pico',last_name:'Pallino'},'year':2010},
 * {'id':3,'title':'German course','author':{first_name:'Max',last_name:'Musterman'},'year':2009}
 * ]
 *  
 * 
 * updateObject(books, 2, {title: 'Corso di Italiano'});
 * 
 * console.log(books)
 * // => [{ 'id': 1, 'title': 'English course', 'author': {first_name: 'Joe', last_name:'Doe'} },
 * //     { 'id': 2, 'title': 'Corso di Italiano', 'author': {first_name: ' Pico', last_name:'Pallino'} },
 * //     { 'id': 3, 'title': 'German course', 'author': {first_name: 'Max', last_name:'Musterman'} }],
 * ```
 */
export function  updateObject(arrObj: [any], id: string | number, patch: any) {
    const uptElement = getObject(arrObj, { id: id });
    if (uptElement) { 
        Object.assign(uptElement, patch);
        return true;
        } else {
            return false;
        }
}



// 2-DELETE METHODS

/**
 * This method modifies the input array by deleting the element with given id.
 *
 * @category 2-DELETE
 * @param {*} arrObj An array of objects.
 * @param {*} id Unique string or number that identifies the object.
 * @returns {*} Returns undefined.
 * @see {@link  deleteByIdInNewArray} {@link  deleteObjects} 
 * @example
 * ```
 * const books = [
 * {'id':1,'title':'English course','author':{first_name:'Joe',last_name:'Doe'},'year':2009},
 * {'id':2,'title':'Italian course','author':{first_name:'Pico',last_name:'Pallino'},'year':2010},
 * {'id':3,'title':'German course','author':{first_name:'Max',last_name:'Musterman'},'year':2009}
 * ]
 *  
 * 
 * deleteById(books, 2);
 * 
 * console.log(books)
 * // => [{ 'id': 1, 'title': 'English course', 'author': {first_name: 'Joe', last_name:'Doe'} },
 * //     { 'id': 3, 'title': 'German course', 'author': {first_name: 'Max', last_name:'Musterman'} }],
 * ```
 */
    export function  deleteById(arrObj: Array<any>, id: number | string) {
        const foundObj: any = null;
        arrObj.every((obj, idx) => {
            if (obj.id === id || obj === id)  {
                if (idx > -1) {
                    arrObj.splice(idx, 1);
                }
                return false;
            }
            return true;
        });
    }

    /**
 * This method creates a shallow copy of the input array and remove the element of given id.
 *
 * @category 2-DELETE
 * @param {*} arrObj An array of objects.
 * @param {*} id Unique string or number that identifies the object.
 * @returns {*} Returns new array with element removed.
 * @see {@link  deleteById}  {@link  deleteObjects} 
 * @example
 * ```
 * const books = [
 * {'id':1,'title':'English course','author':{first_name:'Joe',last_name:'Doe'},'year':2009},
 * {'id':2,'title':'Italian course','author':{first_name:'Pico',last_name:'Pallino'},'year':2010},
 * {'id':3,'title':'German course','author':{first_name:'Max',last_name:'Musterman'},'year':2009}
 * ]
 *  
 * 
 * const newBookArray = deleteByIdInNewArray(books, 2);
 * 
 * console.log(books)
 * // => [{ 'id': 1, 'title': 'English course', 'author': {first_name: 'Joe', last_name:'Doe'} },
 * //    { 'id': 2, 'title': 'Italian course', 'author': {first_name: ' Pico', last_name:'Pallino'} },
 * //    { 'id': 3, 'title': 'German course', 'author': {first_name: 'Max', last_name:'Musterman'} }],
 * 
 * console.log(newBookArray)
 * // => [{ 'id': 1, 'title': 'English course', 'author': {first_name: 'Joe', last_name:'Doe'} },
 * //    { 'id': 3, 'title': 'German course', 'author': {first_name: 'Max', last_name:'Musterman'} }],
 * ```
 */
    export function  deleteByIdInNewArray(arrObj: any[], id: number | string): any[] {
        const filteredArray = arrObj.filter((obj, idx) => {
            if (obj.id === id) {
                return false;
            }

            return true;
        });

        return filteredArray;
    }


/**
 * This method modifies the input array by deleting all elements that match the query.
 *
 * @category 2-DELETE
 * @param {*} arrObj An array of objects.
 * @param {*} query A key-value object representing the query. Use "." for nested queries ({"parent.child": "value"}) and "!" for negation ({"!field": "value"}).
 * @returns {*} Returns the array indexes of the removed object.
 * @see {@link  deleteById} 
 * @see deleteByIdInNewArray
 * @example
 * ```
 * const books = [
 * {'id':1,'title':'English course','author':{first_name:'Joe',last_name:'Doe'},'year':2009},
 * {'id':2,'title':'Italian course','author':{first_name:'Pico',last_name:'Pallino'},'year':2010},
 * {'id':3,'title':'German course','author':{first_name:'Max',last_name:'Musterman'},'year':2009}
 * ]
 *  
 * deletedArrayPos = deleteObjects(books, {'year': 2009});
 * 
 * console.log(books)
 * // =>  [ { 'id': 2, 'title': 'Italian course', 'author': {first_name: ' Pico', last_name:'Pallino'}, 'year': 2010 }]
 * 
 * console.log(deletedArrayPos)
 * // =>  [0, 2]
 * ```
 */
    export function  deleteObjects(arrObj: Array<any>, query: any): number[] {
        const reverseIndex: Array<number> = [];
        const removedIndex: Array<number> = [];

        if (arrObj.length > 0) {

            for (let i = arrObj.length; i > 0; i--) { reverseIndex.push(i - 1); }

            for (const index of reverseIndex) {
                const obj = arrObj[index];
                let match = true;

                for (const fieldName in query) {
                    if (Array.isArray(query[fieldName])) {
                        match = match && (query[fieldName].indexOf(obj[fieldName]) > -1);
                    } else {
                        match = match && (obj[fieldName] === query[fieldName]);
                    }
                }

                if (match) {
                    arrObj.splice(index, 1);
                    removedIndex.push(index);
                }

            }
        }
        return removedIndex;
    }

/**
 * This method modifies the input array by deleting all elements in the positions given by list of indexes.
 *
 * @category 2-DELETE
 * @param {*} arrObj An array of objects.
 * @param {*} indexes array indexes to be deleted.
 * @returns {*} Returns undefined.
 * @see {@link  deleteById} 
 * @example
 * ```
 * const books = [
 * {'id':1,'title':'English course','author':{first_name:'Joe',last_name:'Doe'},'year':2009},
 * {'id':2,'title':'Italian course','author':{first_name:'Pico',last_name:'Pallino'},'year':2010},
 * {'id':3,'title':'German course','author':{first_name:'Max',last_name:'Musterman'},'year':2009}
 * ]
 *  
 *deleteByArrayIndexes(books, [1, 2])
 * 
 *console.log(books)
 * // =>  [ {'id': 1, 'title': 'English course', 'author': {first_name: 'Joe', last_name:'Doe'}, 'year': 2009}]
 * 
 * ```
 * 
 */
    export function  deleteByArrayIndexes(arrObj: Array<any>, indexes: Array<number>) {
        if (!indexes || !arrObj) { return; }
        if (!indexes.length || !arrObj.length) { return; }
        const mask = new Array(arrObj.length);
        for (let i = indexes.length - 1; i >= 0; i--) {
            mask[indexes[i]] = true;
        }
        let offset = 0;
        for (let i = 0; i < arrObj.length; i++) {
            if (mask[i] === undefined) {
                arrObj[offset] = arrObj[i];
                offset++;
            }
        }
        arrObj.length = offset;
    }


/**
 * This method returns the entity id number. 
 *
 * @category 4-OTHERS
 * 
 */

    export function extractIds(originalData: any | any[]){
        let output;
            if (Array.isArray(originalData)) {
                output = originalData
                    .map(value => {
                        if (value === null || value === undefined) { return null; }
                        if (value.hasOwnProperty('id')) { return value.id; }
                        if (typeof (value) === 'number' || typeof (value) === 'string') { return value; }
                    });
            } else {
                const value = originalData;
                if (value === null || value === undefined) { return null; }
                else if (value.hasOwnProperty('id')) { output = value.id; }
                else if (typeof (value) === 'number' || typeof (value) === 'string') { output = value; }
            }
        return output;
    }

/**
 * This method reduces a nested field (db relationship) to its id or array of ids.
 *
 * @category 4-OTHERS
 * 
 */
    export function  extractNestedIds(object: any, field: any): any {
        const value = object[field];

        if (value === null || value === undefined) {return null; }

        if (typeof (value) === 'number' || typeof (value) === 'string') {
          return value;
        }

        if (value instanceof Array){
            return (value as any[]).map((e, i) => extractNestedIds(value, i));
        }

        if (value.hasOwnProperty('id')) {
            return object[field]['id'];
        }

        return null;

    }
