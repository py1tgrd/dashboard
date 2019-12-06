//script.js


//TODO
/*
Load from QR code (already displays QR code)
Remove hardcoded numbers where possible
Non-integer age ratings (incorrect answer)?
Non-integer age diff (NaN)
Tidying the code and use new CS6 format
Make ApplyRF work based on gender + mortality object only, and link to tpx too
Annuitycalculate load via object
*/


var CMI_M; //global improvements table for males
var CMI_F; //global improvements table for females
var base_M; //global base table for males
var base_F; //global base table for females
var testYOB; //test to see if it is YOB which is affecting the outcome


function test_annuity(age, sex, annuityType, mortM, mortF, propM, propF, malesOlderBy, SDAR, interest, escalation, guarantee, frequency, inAdvance){
	
	factor = AnnuityFactor(age, sex, annuityType, mortM, mortF, propM, propF, malesOlderBy, SDAR, interest, escalation, guarantee, frequency, inAdvance);	
	return Number(Math.round(factor+'e4')+'e-4');

}

function AnnuityCalculate(mortM, mortF, MalesOlder, dblInt,dblEsc, mFrequency, mInAdvance){

	var Age1;
	var Age2;
	var lm;
	var lf;
	var Nx;
	var Dx;		

	var minAge = 0;
	var maxAge = 120; //is there an override in the table too, so that a max is needed?

	var dblTimingAdj = 0;
	
	var mLx = Array.from(Array(3), () => new Array(maxAge - minAge+1)); //create 2D array
	//[0..2] - male, female, joint
	//mLx[1][3]=1; If 2 then 4, reference last array like this 

	var v = Array(maxAge - minAge); //1d array of discount 1/(1+i)^t
	var mAnn = Array.from(Array(3), () => new Array(maxAge - minAge+1)); //create 2D array for annuities [0..2] - male, female, joint
	
		
	//base_M = loadBaseTable(mortM.basetable);
	//loadBaseTable(mortM.basetable);
	
	
	let url ="https://py1tgrd.github.io/dashboard/" +mortM.basetable.substring(0,2)+ "/"+mortM.basetable+".json"
	
	
	//Check to see if call is needed
	if (typeof(base_M) == 'undefined'){
		base_M = readTextFile(url);
		//Adjust base table so it has the correct number of rows
		for(i=0;i<base_M.minAge;i++){ base_M.lx.unshift(base_M.lx[0]);}
	}else if (base_M["tableName"] != mortM.basetable){
		base_M = readTextFile(url);
		//Adjust base table so it has the correct number of rows
		for(i=0;i<base_M.minAge;i++){ base_M.lx.unshift(base_M.lx[0]);}
	}
	

	
	
	mortM.lx = adjBaseTable(base_M, mortM.ageRating, mortM.Loading);
	
	//document.write(mortM.lx); //Testing
	mortM.baseYear = base_M.baseYear;
	 
	let LTTR =  "_L" +mortM.LTT ;//"_L1.5";
	let SK ="_S"+mortM.Sk;    //"_S7.5";
	let A = "_A"+mortM.A;
	if (mortM.CMI_model == 2015){
		SK ="";
	}
	if (mortM.CMI_model < 2018){
		A ="";
	}
	
	
    let url_M ="https://py1tgrd.github.io/dashboard/CMI"+mortM.CMI_model+"/CMI_"+mortM.CMI_model+LTTR+SK+A+"_M.json"
	
	
	var tempCMI;
	

	//Check to see if call is needed
	if (typeof(CMI_M) == 'undefined'){
		CMI_M = readTextFile(url_M);
	}else if (CMI_M["name"] != "CMI_"+mortM.CMI_model+LTTR+SK+A+"_M"){
		CMI_M = readTextFile(url_M);
	}	
	
	

	mortM.lx = ApplyRF(mortM, CMI_M);
	lm = mortM.lx;
	
	
	//base_F = loadBaseTable(mortF.basetable);
	//loadBaseTable(mortF.basetable);	
	
	url ="https://py1tgrd.github.io/dashboard/" + mortF.basetable.substring(0,2)+ "/"+mortF.basetable+".json"
	
	//Check to see if call is needed
	if (typeof(base_F) == 'undefined'){
		base_F = readTextFile(url);
		for(i=0;i<base_F.minAge;i++){ base_F.lx.unshift(base_F.lx[0]);}
	}else if (base_F["tableName"] != mortF.basetable){
		base_F = readTextFile(url);
		for(i=0;i<base_F.minAge;i++){ base_F.lx.unshift(base_F.lx[0]);}
	}	
	
	mortF.lx = adjBaseTable(base_F, mortF.ageRating, mortF.Loading);
	mortF.baseYear = base_F.baseYear;
	
	
	LTTR =  "_L" +mortF.LTT ;//"_L1.5";
	SK ="_S"+mortF.Sk;    //"_S7.5";
	A = "_A"+mortF.A;
		if (mortF.CMI_model == 2015){
		SK ="";
	}
	if (mortF.CMI_model < 2018){
		A ="";
	}
	
	
	url_F ="https://py1tgrd.github.io/dashboard/CMI"+mortF.CMI_model+"/CMI_"+mortF.CMI_model+LTTR+SK+A+"_F.json"
	
	if (typeof(CMI_F) == 'undefined'){
		CMI_F = readTextFile(url_F);
	}else if (CMI_F["name"] != "CMI_"+mortF.CMI_model+LTTR+SK+A+"_F"){
		CMI_F = readTextFile(url_F);
	}	
	
	mortF.lx = ApplyRF(mortF, CMI_F);
	
	lf = mortF.lx;
	
	
	//populate lxs into mLx 2D arrage
	for(Age1 =0; Age1 < maxAge-minAge+1; Age1++){
		mLx[0][Age1]=lm[Age1];
		mLx[1][Age1]=lf[Age1];
		Age2=Math.max(0,Math.min(maxAge,Age1 - MalesOlder));
		mLx[2][Age1]=lm[Age1] * lf[Age2];
	}

	/*for(x=0; x<121; x++){
		document.write(x +"," +lm[x]+"<br>");
	}*/


	//Timing adjustment
	if (mFrequency == 1){
		dblTimingAdj = (mInAdvance ? 0 : 1);
	}
	else if (mFrequency > 1){
        dblTimingAdj = 0.5 + (mInAdvance ? -1 : 1) / (2 * mFrequency);
	}
	else{
        dblTimingAdj = 0.5;
    }	

	//Create array of v (discount factors)
	for(i=0;i<maxAge-minAge+1; i++){
		v[i]= Math.pow(((1+dblEsc)/(1+dblInt)),i);
	}
	

	//Calculate annuity factors
	for(var sex=0;sex<3;sex++){	//Runs for males, females and joint life 

		for(Age1=0;Age1<maxAge-minAge+1;Age1++){
			Nx=0;
			for(Age2 = (maxAge-minAge); Age2 >= Age1; Age2--){
				Dx = mLx[sex][Age2] * v[Age2-Age1];
				Nx += Dx;
			}
		
			if(Dx > 0){
				mAnn[sex][Age1] = (Nx / Dx) - dblTimingAdj;
				/* Annually in arrears should be adjusted here to remove first increase */
				    if (mFrequency === 1 && !mInAdvance){
						mAnn[sex][Age1] /=  (1 + dblEsc);
					}	
			}	
		}
	}	
	

	/* Outputs for testing */
	 // for(i=110;i<121;i++){
		// document.write(i + " " + mAnn[1][i] + "<br>");
	// }
	
	// document.write("howdy");
	
	return mAnn;
	
	
}

// function AnnuityFactor(){
function AnnuityFactor(pAge, pSex, pAnnuityType, pMortM, pMortF, pPropMarrM, pPropMarrF, pMalesOlder, pPropSDAR, pInterest, pEscalation, pGuarantee, pFrequency, pInAdvance){

	// var pAge = 101;
	// var pSex = 0; //Male =0, Female = 1, 2 = Joint
    // var pAnnuityType =0; //0-SL, 1-Rev, 2=Combined, 10-JointLife
    // var pMortM = "S2PMA";
	// var pMortF = "S2PFA";
    // var pPropMarrM = 1.0; 
	// var pPropMarrF = 1.0;
    // var pMalesOlder = 3; 
	// var pPropSDAR = 0.5;
    // var pInterest = 0.04; 
	// var pEscalation = 0.02;
    // var pGuarantee = 4.5; 
	// var pFrequency = 1;
    // var pInAdvance = true;
	
    var aFactor = 0;
	
	//Hardcodes escalation time as 0.5
	
	var a = AnnuityCalculate(pMortM, pMortF, pMalesOlder, pInterest,pEscalation, pFrequency, pInAdvance);	
	

	if(pAnnuityType === 0 || pAnnuityType ===10){
				
		if(pGuarantee <= 0){
			//i.e. no guarantee
			let intAge = Math.floor(pAge);
			let dp = pAge - intAge;
			
			
			if(dp <0.01){
				aFactor=a[pSex][pAge]; 
			}else{
				aFactor=a[pSex][intAge+1] * dp + a[pSex][intAge] * (1-dp); 
			}
			
			
		}else{
			if(pGuarantee === Math.floor(pGuarantee)){
			//If integer guarantee
				var a1 = AnnuityCertain(pGuarantee, pFrequency, pInAdvance, pInterest, pEscalation, 0.5);
				
				let intAge = Math.floor(pAge);
				let dp = pAge - intAge;
				var a2 = 0;
			
				if(dp <0.01){
					a2 = a[pSex][pAge+pGuarantee]; 
				}else{
					a2 = a[pSex][intAge+1+pGuarantee] * dp + a[pSex][intAge+pGuarantee] * (1-dp); 
				}
				
				
				
				
				//Annuity = a1 + a2 * D/D
				//D/D = tPx * (1+esc) ^ (num incs) / (1+i) ^ (guar)
				aFactor = a1 + a2 * tPx((pSex === 0 ? pMortM: pMortF), pAge, pGuarantee) * Math.pow(1+pEscalation,NumIncs(pGuarantee, 0.5, pFrequency, pInAdvance)) / Math.pow(1+pInterest,pGuarantee);
			
			}
			else{
			// /*If non-integer guarantee, interpolate */
			    var a1 = AnnuityFactor(pAge, pSex, pAnnuityType, pMortM, pMortF, pPropMarrM, pPropMarrF, pMalesOlder, pPropSDAR,pInterest, pEscalation, Math.floor(pGuarantee), pFrequency, pInAdvance);
                
				var a2 = AnnuityFactor(pAge, pSex, pAnnuityType, pMortM, pMortF, pPropMarrM, pPropMarrF, pMalesOlder, pPropSDAR, pInterest, pEscalation, Math.floor(pGuarantee) + 1, pFrequency, pInAdvance);
                
				aFactor = a1 - (pGuarantee - Math.floor(pGuarantee))*( a1 - a2);
			}
		}
		
		
	}else if(pAnnuityType === 1)
	{
		//Reversionary annuities
		var AgeM = pAge + (pSex === 1 ? pMalesOlder : 0);
		var AgeF = AgeM - pMalesOlder;
        var SpsAge = (pSex === 1 ? AgeM : AgeF);
        var SpsSex = (pSex === 1 ? 0: 1);
			
		/*a1 = spouse's single life annuity, remembering to use SPOUSE's current age */
		var a1 = AnnuityFactor(SpsAge, SpsSex, 0, pMortM, pMortF, 0, 0, pMalesOlder, 0, pInterest, pEscalation, 0, pFrequency, pInAdvance);
		console.log(a1);
		
		
		// /*a2 = joint annuity (first death), which requires the MALE current age */
		var a2 = AnnuityFactor(AgeM, 2, 10, pMortM, pMortF, 0, 0, pMalesOlder, 0, pInterest, pEscalation, 0, pFrequency, pInAdvance);
				
		aFactor = a1 - a2;
	}
	else{
		//Combined annuity (pAnnuityType ===2), i.e. SL + Rev
		aFactor= AnnuityFactor(pAge, pSex, 0, pMortM, pMortF, 0, 0, pMalesOlder, 0, pInterest, pEscalation, pGuarantee, pFrequency, pInAdvance);
		aFactor += (pSex === 0 ? pPropMarrM : pPropMarrF) * pPropSDAR * AnnuityFactor(pAge, pSex, 1, pMortM, pMortF, 0, 0, pMalesOlder, 0, pInterest, pEscalation, 0, pFrequency, pInAdvance);
	}
	
	return aFactor;
	
}

function AnnuityCertain(pTerm, pFrequency, pInAdvance,pInterest, pEscalation, pEscTime){
	var ACertain = 0;
	var continuous = false;
		
	if(pFrequency <=0){
		pFrequency = 1000;
		pInAdvance = true;
		continuous = true;
	}
	
    var lngPayments = Math.floor(pTerm * pFrequency + 0.5);   
    var iMin = (pInAdvance ? 0: 1);
    var iMax = iMin + lngPayments;
    
	var dblTerm;
	
    // 'Loop through every payment, apply increases when due then discount and sum
    for(i=iMin;i< iMax;i++){
        dblTerm = i / pFrequency;
		var dblPayment = Math.pow(1 + pEscalation, NumIncs(dblTerm, pEscTime, pFrequency, pInAdvance));
		ACertain += (dblPayment / Math.pow(1 + pInterest, dblTerm));
	}
    
	ACertain /= pFrequency;
	if(continuous){
		ACertain /= Math.Pow(1+pInterest,(0.5/pFrequency));
	}

	return ACertain;
	
}

function NumIncs(pTerm, pEscTime, pFrequency, pInAdvance){
	
	var t; //used to measure the time of each pension increase
    var tFirstPayment=0; //time of the first payment
	var nIncs=0; 
 
    if (pEscTime < 0){ //continuous increases
        nIncs = pTerm;
	}
    else{
        //pTerm is prone to rounding error so add 0.1 days of tolerance
        pTerm += 0.1 / 365.25;
        
        if (!pInAdvance && pFrequency > 0) {tFirstPayment = 1 / pFrequency;}
        
        t = pEscTime;
        while(t <= pTerm){
            if (t >= tFirstPayment){
				nIncs++;
			}
            t++;
        }
    }
	return nIncs;	
 
 }	

function tPx(pMortTable, pAge, pTerm=1) {
   	var  lxt = lx(pMortTable, pAge + pTerm);
    var lx0 = lx(pMortTable, pAge);
    
	return (lx0>0 ? lxt/lx0 : 0);
}

function lx(pMortTable, pAge){
	var MAX_AGE = 120;
	var lxExist = (pMortTable.lx.length >0);
	var l;
	
    if(pAge > MAX_AGE){
        return 0;
	}
    else{
        if (pAge < 0) {pAge = 0;}
			var IntAge = Math.floor(pAge);
			if(lxExist){
				l = pMortTable.lx;
			}else{
				l="error"; //need a "load mortality" routine!! TODO - but only if calling on it's own.
				// l = adjustBaseTable(pMortTable.basetable, pMortTable.ageRating,pMortTable.Loading); //Update, so reflect RF
			}
						
            if (IntAge < MAX_AGE && IntAge < pAge){
				return l[IntAge]-(IntAge-pAge)*(l[IntAge + 1] - l[IntAge]);
			}
			else{
                return l[IntAge];
            }
		}
 }
 
 
 
 
 

function GetMortality(mort){
	for(i=0;i<base_table.length;i++){
		if(base_table[i]["Table Name"] == mort){
			var arr = Array(120-0+1);

			for(j=0;j<arr.length;j++){
				if(j<17){
					arr[j] = base_table[i][16];
				}
				else{
					arr[j]= base_table[i][j];	
				}
			}
			return arr;
			break;
		}		
	}
}

function loadBaseTable(mortTable, sex){
	//Load from website - eventually
	
	
	/*
	switch(mortTable){
	case "S2PMA":
		return base_table[1];
		break;
	case "S2PFA":
		return base_table[0];
		break;
	case "S2NMA":
		return base_table[2];
		break;
	case "S2PFL":
		return base_table[3];
		break;	
	}	*/
	
	//if S2
	let url ="https://py1tgrd.github.io/dashboard/S2/"+mortTable+".json"
	console.log(url);
	//Check to see if call is needed
	if (typeof(base_M) == 'undefined'){
		base_M = readTextFile(url);
	}else if (base_M["tableName"] != mortTable){
		base_M = readTextFile(url);
	}	
	
	
	
}

function adjBaseTable(mort, AgeRating, Loading){
	//TODO - add default values, if possible
	//TODO - doesn't need to be just lx, mort, could then look at minAge
	
	
	//var AgeRating=0;
	//var Loading=1;
					
	var adjMort = Array(120-0+1);
	adjMort[0]=1000;
	var qx=1;
	
	
	var mortlx_copy = Array(120-0+1);
	
	for(i=0; i<121;i++){mortlx_copy[i]=mort.lx[i];}
	
	

	//Age rating adjustment
	
	if(AgeRating <0){
		for(i=0;i>AgeRating;i--){
			mortlx_copy.unshift(mortlx_copy[0]); //always 1000?
			mortlx_copy.pop();
		}
		/*for(i=0; i<AgeRating;i++){
			mortlx_copy[i]=mortlx[0];
		}	
		for(i=AgeRating;i<121;i++){
			mortlx_copy[i]=mortlx[i-AgeRating];
		}*/	
	
		
		
	} else if (AgeRating >0){
		for(i=0;i<AgeRating;i++){
			mortlx_copy.shift();
			mortlx_copy.push(0);
		}
		
		/*
		for(i=0; i<121-AgeRating;i++){
			mortlx_copy[i]=mortlx[i+AgeRating];
		}	
		for(i=121-AgeRating;i<121;i++){
			mortlx_copy[i]=0;
		}*/
			
		
	}
	else{
		//Do nothing
	}
	
	//for(i=0;i<=120;i++){document.write(i+": "+mortlx_copy[i]+"<br>")};
	
	
	for(i=0;i<120;i++){
		if(mortlx_copy[i]>0){
			qx=Loading*(1-mortlx_copy[i+1]/mortlx_copy[i]);
		}else{
			qx=1;
		}
		
		if(qx<=0){
			//error handling, for negative probabilities of death
			adjMort[i+1]=mortlx_copy[i]; //i.e. ignore qx adjustment
		}else if (qx>1 || mortlx_copy[i]==0){
			adjMort[i]=0; //error handling for other odd P(Death)
		}else{
			//if ok
			adjMort[i+1]=adjMort[i]*(1-qx);
		}
	
	}

	if(adjMort[120]==undefined){adjMort[120]=0;} //hack, so that last number isn't undefined???
	
	// for(i=0;i<=120;i++){document.write(i+","+adjMort[i]+"<br>");}
	
	return adjMort;	
	
	
}




function adjustBaseTable_old(mortTable, AgeRating, Loading){
	//TODO - add default values, if possible
	
	//var AgeRating=0;
	//var Loading=1;
	var mort = GetMortality(mortTable);
	var adjMort = Array(120-0+1);
	adjMort[0]=1000;
	var qx=1;

	
	//Age rating adjustment
	if(AgeRating <0){
		for(i=0;i>=AgeRating;i--){
			mort.unshift(mort[0]);
			mort.pop();
		}
	} else if (AgeRating >0){
		for(i=0;i<=AgeRating;i++){
			mort.shift();
			mort.push(0);
		}
	}
	else{
		//Do nothing
	}

	
	for(i=0;i<120;i++){
		if(mort[i]>0){
			qx=Loading*(1-mort[i+1]/mort[i]);
		}else{
			qx=1;
		}
		
		if(qx<=0){
			//error handling, for negative probabilities of death
			adjMort[i+1]=mort[i]; //i.e. ignore qx adjustment
		}else if (qx>1 || mort[i]===0){
			adjMort[i]=0; //error handling for other odd P(Death)
		}else{
			//if ok
			adjMort[i+1]=adjMort[i]*(1-qx);
		}
	
	}
	
	// for(i=0;i<120;i++){
		// document.write(i+ ":" + adjMort[i]+"<br>");
	// }
	
	return adjMort;
}
	
function GetRF(MortObject, Age, Year){

	//Restrict Age and Year to ranges permitted in the mortality object
	return MortObject.rf[Math.min(Math.max(Age-MortObject.minAge,0),MortObject.maxAge-1)][Math.min(Math.max(Year-MortObject.minYear,0),MortObject.maxYear-1)];
}	
	

function ApplyRF(mort, improvement){
	
	var mort_projected = Array(120-0+1);
	var baseYear = mort.baseYear; // ok
	var mort_base = mort.lx;
	var YOB = mort.YOB; //ok
	
	var qx=0;
	var rf=1; //changed from 0 - for ccal
	
	
	mort_projected[0] = mort_base[0]; //First lx is unchanged (I think)
	
	
	for(i=0;i<120;i++){ //is this correct, now that 121 - 1, rather than 120
		qx = 1 - mort_base[i+1]/mort_base[i];
		var y = improvement.minYear;
		
		if(mort.YearOrCalendar=='B'){//yob
			for(i=0;i<120;i++){ //is this correct, now that 121 - 1, rather than 120
				qx = 1 - mort_base[i+1]/mort_base[i];
				rf = GetRF(improvement,Math.max(i,improvement.minAge),Math.max(YOB+i,baseYear)) / GetRF(improvement,Math.max(i,improvement.minAge),baseYear); 
				mort_projected[i+1]=mort_projected[i]*(1-qx*rf); 
				if(isNaN(mort_projected[i+1])){
					mort_projected[i+1]=0;
				}
			}
			
		}else{//calendar  -- removed i next to yob... check
			for(i=0;i<120;i++){ //is this correct, now that 121 - 1, rather than 120
				qx = 1 - mort_base[i+1]/mort_base[i];
				rf = GetRF(improvement,Math.max(i,improvement.minAge),Math.max(YOB,baseYear)) / GetRF(improvement,Math.max(i,improvement.minAge),baseYear); 
				mort_projected[i+1]=mort_projected[i]*(1-qx*rf); 
				if(isNaN(mort_projected[i+1])){
					mort_projected[i+1]=0;
				}
			}



		
		}
		
	}
			
	return mort_projected;
}
	

function readTextFile(file)
{
	var allText;
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = JSON.parse(rawFile.responseText);
				
            }
        }
    }
    rawFile.send(null);
	return allText;
}
	
	
	
