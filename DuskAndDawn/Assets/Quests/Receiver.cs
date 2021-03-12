using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Receiver : MonoBehaviour
{
    public virtual bool getActive()
    {
    	Debug.Log("Base Class");
    	return false;
    }
}
